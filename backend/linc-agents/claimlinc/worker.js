/**
 * Cloudflare Worker for ClaimLinc Agent
 * Handles claim-related operations
 */

import { Router } from 'itty-router';

const router = Router();

// Helper functions
function generateClaimId() {
  return `HL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

// Claims processing endpoints
router.post('/agents/claim', async (request, env) => {
  try {
    const task = request.headers.get('X-MCP-Task');
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    const data = await request.json();

    console.log(`ClaimLinc Task: ${task}, Request ID: ${requestId}`);

    const response = {
      status: 'success',
      timestamp: Date.now()
    };

    switch (task) {
      case 'submit':
        const claimId = generateClaimId();
        
        // Store claim data in KV (if available)
        if (env.CLAIMS_DATA) {
          await env.CLAIMS_DATA.put(claimId, JSON.stringify({
            ...data,
            claim_id: claimId,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            request_id: requestId
          }));
        }

        response.data = {
          claim_id: claimId,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          expected_response: '7-10 business days'
        };
        response.message = 'Claim submitted successfully';
        break;

      case 'verify':
        const { claim_id } = data;
        
        // Simulate claim status check
        const statuses = ['pending', 'processed', 'paid', 'denied', 'appealed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const statusDetails = {
          pending: { message: 'Claim is pending review', eta_days: 5 },
          processed: { message: 'Claim processed on 2025-05-10', amount_approved: 420.50 },
          paid: { message: 'Payment issued on 2025-05-11', payment_amount: 385.75, check_number: 'EFT-38291' },
          denied: { message: 'Claim denied due to missing information', denial_code: 'A382', appeal_deadline: '2025-05-30' },
          appealed: { message: 'Appeal in progress', submitted_on: '2025-05-05' }
        };

        response.data = {
          claim_id: claim_id,
          status: status,
          details: statusDetails[status],
          last_updated: new Date().toISOString()
        };
        response.message = 'Claim status retrieved';
        break;

      case 'dispute':
        const disputeId = `DSP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        
        response.data = {
          claim_id: data.claim_id,
          dispute_id: disputeId,
          status: 'appeal_submitted',
          submitted_at: new Date().toISOString(),
          expected_response: '14-21 business days'
        };
        response.message = 'Claim dispute submitted successfully';
        break;

      case 'check':
        // Eligibility checking
        const procedures = {};
        
        for (const code of data.procedure_codes || []) {
          const covered = Math.random() > 0.2; // 80% coverage chance
          
          if (covered) {
            procedures[code] = {
              covered: true,
              requires_authorization: Math.random() > 0.5,
              copay: [0, 20, 35, 50, 75][Math.floor(Math.random() * 5)],
              coinsurance_percentage: [0, 10, 20, 30][Math.floor(Math.random() * 4)],
              notes: 'Standard cost sharing applies'
            };
          } else {
            procedures[code] = {
              covered: false,
              reason: ['Excluded from plan', 'Experimental/investigational', 'Not medically necessary', 'Annual limit exceeded'][Math.floor(Math.random() * 4)]
            };
          }
        }

        response.data = {
          patient_id: data.patient_id,
          insurance_id: data.insurance_id,
          insurance_status: 'Active',
          plan_name: 'Premium Health PPO',
          procedures: procedures,
          deductible_met: Math.random() > 0.5,
          check_date: new Date().toISOString()
        };
        response.message = 'Eligibility check completed';
        break;

      default:
        return new Response(JSON.stringify({
          status: 'error',
          message: `Unknown task: ${task}`,
          timestamp: Date.now()
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(response), {
      status: task === 'submit' ? 201 : 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: `Internal server error: ${error.message}`,
      timestamp: Date.now()
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'ClaimLinc',
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' } });
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env);
  }
};
