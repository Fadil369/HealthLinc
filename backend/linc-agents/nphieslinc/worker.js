/**
 * Cloudflare Worker for NphiesLinc Agent
 * Handles NPHIES integration operations
 */

import { Router } from 'itty-router';

const router = Router();

// NPHIES Message Type to Agent Mapping
const MESSAGE_AGENT_MAPPING = {
  "eligibility-request": "authlinc",
  "eligibility-response": "authlinc",
  "priorauth-request": "claimlinc",
  "priorauth-response": "claimlinc", 
  "claim-request": "claimlinc",
  "claim-response": "claimlinc",
  "communication-request": "notifylinc",
  "communication-response": "notifylinc",
  "prescriber-request": "matchlinc",
  "prescriber-response": "matchlinc",
  "payment-notice": "recordlinc",
  "payment-reconciliation": "recordlinc"
};

// Helper functions
function generateCorrelationId() {
  return `NPHIES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function forwardToAgent(agentName, task, data, env) {
  const agentUrls = {
    authlinc: env.AUTHLINC_URL || 'https://authlinc.healthlinc.workers.dev',
    claimlinc: env.CLAIMLINC_URL || 'https://claimlinc.healthlinc.workers.dev', 
    matchlinc: env.MATCHLINC_URL || 'https://matchlinc.healthlinc.workers.dev',
    doculinc: env.DOCULINC_URL || 'https://doculinc.healthlinc.workers.dev',
    notifylinc: env.NOTIFYLINC_URL || 'https://notifylinc.healthlinc.workers.dev',
    recordlinc: env.RECORDLINC_URL || 'https://recordlinc.healthlinc.workers.dev'
  };

  const agentUrl = agentUrls[agentName];
  if (!agentUrl) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const response = await fetch(`${agentUrl}/agents/${agentName.replace('linc', '')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MCP-Task': task,
      'X-Request-ID': crypto.randomUUID()
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Agent ${agentName} error: ${response.status}`);
  }

  return await response.json();
}

async function forwardToNphiesIntegration(endpoint, data, env) {
  const nphiesUrl = env.NPHIES_INTEGRATION_URL || 'https://nphies-integration.healthlinc.workers.dev';
  
  const response = await fetch(`${nphiesUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`NPHIES integration error: ${response.status}`);
  }

  return await response.json();
}

function transformForAgent(agentName, extractedData) {
  if (agentName === 'claimlinc') {
    if (extractedData.claims && extractedData.claims.length > 0) {
      const claim = extractedData.claims[0];
      return {
        patient_id: claim.patient?.reference?.replace('Patient/', '') || '',
        provider_id: claim.provider?.reference?.replace('Organization/', '') || '',
        service_date: claim.created,
        diagnosis_codes: claim.diagnosis?.map(d => 
          d.diagnosisCodeableConcept?.coding?.[0]?.code || ''
        ) || [],
        procedure_codes: claim.items?.map(item =>
          item.productOrService?.coding?.[0]?.code || ''
        ) || [],
        total_amount: claim.total?.value || 0,
        insurance_id: claim.insurance?.[0]?.coverage?.reference?.replace('Coverage/', '') || '',
        notes: `NPHIES Bundle: ${extractedData.message_header?.id || 'Unknown'}`
      };
    }
  } else if (agentName === 'authlinc') {
    if (extractedData.eligibility_requests && extractedData.eligibility_requests.length > 0) {
      const eligibility = extractedData.eligibility_requests[0];
      return {
        patient_id: eligibility.patient?.reference?.replace('Patient/', '') || '',
        procedure_codes: [],
        diagnosis_codes: [],
        insurance_id: eligibility.insurance?.[0]?.coverage?.reference?.replace('Coverage/', '') || ''
      };
    }
  }

  return extractedData;
}

function getAgentTask(agentName, messageType) {
  const taskMapping = {
    claimlinc: {
      'claim-request': 'submit',
      'priorauth-request': 'submit',
      'claim-response': 'verify',
      'priorauth-response': 'verify'
    },
    authlinc: {
      'eligibility-request': 'validate',
      'eligibility-response': 'validate'
    },
    notifylinc: {
      'communication-request': 'send',
      'communication-response': 'send'
    },
    matchlinc: {
      'prescriber-request': 'validate',
      'prescriber-response': 'validate'
    }
  };

  return taskMapping[agentName]?.[messageType] || 'process';
}

// NPHIES processing endpoints
router.post('/agents/nphies', async (request, env) => {
  try {
    const task = request.headers.get('X-MCP-Task');
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    const data = await request.json();

    console.log(`NphiesLinc Task: ${task}, Request ID: ${requestId}`);

    const response = {
      status: 'success',
      timestamp: Date.now()
    };

    switch (task) {
      case 'process_bundle':
        const correlationId = data.correlation_id || generateCorrelationId();
        
        // Extract data using NPHIES integration service
        try {
          const extractResult = await forwardToNphiesIntegration('/nphies/extract', {
            resource_type: 'Bundle',
            id: data.bundle?.id || crypto.randomUUID(),
            entry: data.bundle?.entry || [],
            type: data.bundle?.type || 'message',
            timestamp: data.bundle?.timestamp || new Date().toISOString()
          }, env);

          if (extractResult.status !== 'success') {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Failed to extract bundle data',
              details: extractResult
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          const extractedData = extractResult.data;
          const messageType = extractedData.message_type;
          const targetAgent = MESSAGE_AGENT_MAPPING[messageType] || 'recordlinc';
          
          // Transform data for target agent
          const agentData = transformForAgent(targetAgent, extractedData);
          const agentTask = getAgentTask(targetAgent, messageType);

          // Store message tracking in KV
          if (env.NPHIES_MESSAGES) {
            await env.NPHIES_MESSAGES.put(correlationId, JSON.stringify({
              message_type: messageType,
              target_agent: targetAgent,
              processed_at: new Date().toISOString(),
              bundle_id: data.bundle?.id,
              status: 'processed'
            }));
          }

          // Try to forward to agent
          let agentResult;
          try {
            agentResult = await forwardToAgent(targetAgent, agentTask, agentData, env);
          } catch (agentError) {
            console.warn(`Agent forwarding failed: ${agentError.message}`);
            agentResult = { status: 'error', message: agentError.message };
          }

          response.data = {
            correlation_id: correlationId,
            message_type: messageType,
            target_agent: targetAgent,
            agent_task: agentTask,
            agent_result: agentResult,
            bundle_id: data.bundle?.id,
            processed_at: new Date().toISOString()
          };
          response.message = `Bundle processed and forwarded to ${targetAgent}`;

        } catch (error) {
          return new Response(JSON.stringify({
            status: 'error',
            message: `NPHIES integration error: ${error.message}`,
            timestamp: Date.now()
          }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        break;

      case 'transform':
        try {
          const transformResult = await forwardToNphiesIntegration(
            `/nphies/transform/${data.message_type}`,
            data.data,
            env
          );
          
          response.data = transformResult;
          response.message = 'Data transformation completed';
        } catch (error) {
          return new Response(JSON.stringify({
            status: 'error',
            message: `Transform error: ${error.message}`,
            timestamp: Date.now()
          }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        break;

      case 'route':
        const targetAgent = data.target_agent || MESSAGE_AGENT_MAPPING[data.message_type] || 'recordlinc';
        const agentData = transformForAgent(targetAgent, data.extracted_data);
        const agentTask = getAgentTask(targetAgent, data.message_type);

        try {
          const agentResult = await forwardToAgent(targetAgent, agentTask, agentData, env);
          
          response.data = {
            target_agent: targetAgent,
            agent_task: agentTask,
            result: agentResult
          };
          response.message = `Data routed to ${targetAgent}`;
        } catch (error) {
          return new Response(JSON.stringify({
            status: 'error',
            message: `Routing error: ${error.message}`,
            timestamp: Date.now()
          }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        break;

      case 'extract':
        try {
          const extractResult = await forwardToNphiesIntegration('/nphies/extract', data, env);
          response.data = extractResult;
          response.message = 'NPHIES data extracted';
        } catch (error) {
          return new Response(JSON.stringify({
            status: 'error',
            message: `Extract error: ${error.message}`,
            timestamp: Date.now()
          }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        break;

      default:
        return new Response(JSON.stringify({
          status: 'error',
          message: `Unknown task: ${task}`,
          timestamp: Date.now()
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(response), {
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
    service: 'NphiesLinc',
    timestamp: new Date().toISOString(),
    integration_status: 'connected'
  }), { headers: { 'Content-Type': 'application/json' } });
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env);
  }
};
