import { Hono } from 'hono';
import { Env } from '../worker';
import { authenticateJWT } from '../auth/session';
import { createLogger } from '../utils/logger';

export const claimlincRoutes = new Hono<{ Bindings: Env }>();

// NPHIES Integration - Saudi Arabia's National Platform for Health Information Exchange Services

interface ClaimRequest {
  patientId: string;
  providerId: string;
  serviceDate: string;
  services: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  diagnosis: Array<{
    code: string;
    description: string;
    type: 'primary' | 'secondary';
  }>;
  insuranceInfo: {
    payerId: string;
    membershipId: string;
    policyNumber: string;
  };
}

interface EligibilityRequest {
  patientId: string;
  membershipId: string;
  payerId: string;
  serviceDate: string;
}

// Submit insurance claim to NPHIES
claimlincRoutes.post('/claims/submit', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const claimData: ClaimRequest = await c.req.json();

    // Validate required fields
    if (!claimData.patientId || !claimData.providerId || !claimData.services?.length) {
      return c.json({ error: 'Missing required claim data' }, 400);
    }

    // Generate claim ID
    const claimId = `CLM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, this would integrate with NPHIES API
    // For now, we'll simulate the claim submission process
    const claimRecord = {
      id: claimId,
      status: 'submitted',
      submissionDate: new Date().toISOString(),
      submittedBy: payload.userId,
      ...claimData,
      estimatedProcessingTime: '3-5 business days',
      trackingNumber: `TRK_${claimId}`
    };

    // Store claim in KV
    await c.env.BRAINSAIT_KV.put(`claim:${claimId}`, JSON.stringify(claimRecord));

    // Store user claim reference
    const userClaimsKey = `user_claims:${payload.userId}`;
    const userClaims = await c.env.BRAINSAIT_KV.get(userClaimsKey);
    const claimsList = userClaims ? JSON.parse(userClaims) : [];
    claimsList.push({
      claimId,
      status: 'submitted',
      submissionDate: claimRecord.submissionDate,
      patientId: claimData.patientId
    });
    
    // Keep only last 100 claims per user
    if (claimsList.length > 100) {
      claimsList.splice(0, claimsList.length - 100);
    }
    
    await c.env.BRAINSAIT_KV.put(userClaimsKey, JSON.stringify(claimsList));

    return c.json({
      claimId,
      status: 'submitted',
      message: 'Claim submitted successfully to NPHIES',
      trackingNumber: claimRecord.trackingNumber,
      estimatedProcessingTime: claimRecord.estimatedProcessingTime
    }, 201);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.nphies('claim_submission_failed', claimData?.patientId, 'error');
    logger.error('NPHIES claim submission failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'nphies_claim_submit',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to submit claim',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Check claim status
claimlincRoutes.get('/claims/:claimId/status', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const claimId = c.req.param('claimId');
    const claimData = await c.env.BRAINSAIT_KV.get(`claim:${claimId}`);

    if (!claimData) {
      return c.json({ error: 'Claim not found' }, 404);
    }

    const claim = JSON.parse(claimData);

    // Verify user has access to this claim
    if (claim.submittedBy !== payload.userId) {
      return c.json({ error: 'Unauthorized access to claim' }, 403);
    }

    // Simulate status updates based on time elapsed
    const submissionTime = new Date(claim.submissionDate).getTime();
    const now = Date.now();
    const hoursElapsed = (now - submissionTime) / (1000 * 60 * 60);

    let currentStatus = claim.status;
    let statusMessage = 'Claim is being processed';

    if (hoursElapsed > 72) { // 3 days
      currentStatus = 'approved';
      statusMessage = 'Claim has been approved for payment';
    } else if (hoursElapsed > 24) { // 1 day
      currentStatus = 'under_review';
      statusMessage = 'Claim is under review by insurance provider';
    } else if (hoursElapsed > 2) { // 2 hours
      currentStatus = 'received';
      statusMessage = 'Claim received by NPHIES';
    }

    return c.json({
      claimId,
      status: currentStatus,
      statusMessage,
      submissionDate: claim.submissionDate,
      lastUpdated: new Date().toISOString(),
      trackingNumber: claim.trackingNumber,
      patientId: claim.patientId,
      totalAmount: claim.services.reduce((sum, service) => 
        sum + (service.quantity * service.unitPrice), 0
      )
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.nphies('claim_status_check_failed', claimId, 'error');
    logger.error('NPHIES claim status check failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'nphies_claim_status',
      userId: payload?.userId,
      metadata: { claimId }
    });
    return c.json({ 
      error: 'Failed to get claim status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Check patient eligibility
claimlincRoutes.post('/eligibility/check', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eligibilityData: EligibilityRequest = await c.req.json();

    if (!eligibilityData.patientId || !eligibilityData.membershipId || !eligibilityData.payerId) {
      return c.json({ error: 'Missing required eligibility data' }, 400);
    }

    // In real implementation, this would call NPHIES eligibility API
    // Simulating eligibility response
    const eligibilityResponse = {
      patientId: eligibilityData.patientId,
      membershipId: eligibilityData.membershipId,
      payerId: eligibilityData.payerId,
      isEligible: true,
      coverageDetails: {
        planType: 'Comprehensive Health Insurance',
        effectiveDate: '2024-01-01',
        expirationDate: '2024-12-31',
        copayAmount: 50,
        deductibleAmount: 500,
        maxBenefitAmount: 100000
      },
      coveredServices: [
        'Consultation',
        'Diagnostic Tests',
        'Medications',
        'Surgical Procedures',
        'Emergency Care'
      ],
      lastVerified: new Date().toISOString(),
      verificationId: `VER_${Date.now()}`
    };

    // Store eligibility verification
    await c.env.BRAINSAIT_KV.put(
      `eligibility:${eligibilityData.patientId}:${eligibilityData.payerId}`,
      JSON.stringify(eligibilityResponse),
      { expirationTtl: 24 * 60 * 60 } // 24 hours
    );

    return c.json(eligibilityResponse);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.nphies('eligibility_check_failed', eligibilityData?.patientId, 'error');
    logger.error('NPHIES eligibility check failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'nphies_eligibility_check',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to check eligibility',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user's claims history
claimlincRoutes.get('/claims', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userClaimsKey = `user_claims:${payload.userId}`;
    const userClaimsData = await c.env.BRAINSAIT_KV.get(userClaimsKey);
    
    const claims = userClaimsData ? JSON.parse(userClaimsData) : [];

    return c.json({
      claims: claims.reverse(), // Most recent first
      total: claims.length
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get user claims', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_user_claims',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to get claims',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get claim details
claimlincRoutes.get('/claims/:claimId', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const claimId = c.req.param('claimId');
    const claimData = await c.env.BRAINSAIT_KV.get(`claim:${claimId}`);

    if (!claimData) {
      return c.json({ error: 'Claim not found' }, 404);
    }

    const claim = JSON.parse(claimData);

    // Verify user has access to this claim
    if (claim.submittedBy !== payload.userId) {
      return c.json({ error: 'Unauthorized access to claim' }, 403);
    }

    return c.json(claim);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get claim details', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_claim_details',
      userId: payload?.userId,
      metadata: { claimId }
    });
    return c.json({ 
      error: 'Failed to get claim details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Batch claim submission
claimlincRoutes.post('/claims/batch', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { claims }: { claims: ClaimRequest[] } = await c.req.json();

    if (!Array.isArray(claims) || claims.length === 0) {
      return c.json({ error: 'No claims provided' }, 400);
    }

    if (claims.length > 50) {
      return c.json({ error: 'Maximum 50 claims per batch' }, 400);
    }

    const results: Array<{
      claimId: string;
      status: string;
      trackingNumber: string;
    }> = [];
    const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    for (const claimData of claims) {
      const claimId = `CLM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const claimRecord = {
        id: claimId,
        batchId,
        status: 'submitted',
        submissionDate: new Date().toISOString(),
        submittedBy: payload.userId,
        ...claimData,
        trackingNumber: `TRK_${claimId}`
      };

      await c.env.BRAINSAIT_KV.put(`claim:${claimId}`, JSON.stringify(claimRecord));
      
      results.push({
        claimId,
        status: 'submitted',
        trackingNumber: claimRecord.trackingNumber
      });
    }

    return c.json({
      batchId,
      totalClaims: claims.length,
      results,
      message: 'Batch claims submitted successfully'
    }, 201);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.nphies('batch_claim_submission_failed', undefined, 'error', { batchSize: claims?.length });
    logger.error('NPHIES batch claim submission failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'nphies_batch_submit',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to submit batch claims',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
