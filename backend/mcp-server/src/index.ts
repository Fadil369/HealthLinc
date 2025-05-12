/**
 * healthlinc-mcp
 * 
 * MCP Server for the HealthLinc Ecosystem
 * Handles routing between clients and LINC agents
 * 
 * Author: Dr. Mohamed El Fadil - BRAINSAIT Founder
 */

import { Router } from 'itty-router';
import { v4 as uuidv4 } from 'uuid';
import { extractToken, verifyToken, generateCorsHeaders } from './auth';
import { getAgentEndpoints, getAllowedOrigins, LOG_RETENTION_DAYS } from './config';
import { logRequest, getLogsByDate, cleanupOldLogs } from './logging';
import { MCPRequest, MCPResponse, ALLOWED_TASKS, LINCAgent } from './types';

interface Env {
  HEALTHLINC_TOKENS: KVNamespace;
  HEALTHLINC_LOGS: KVNamespace;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
}

// Create router instance
const router = Router();

/**
 * Authorize the request using bearer token
 */
async function authorize(request: Request, env: Env): Promise<boolean> {
  const token = extractToken(request);
  if (!token) return false;
  return await verifyToken(token, env.HEALTHLINC_TOKENS);
}

/**
 * Error response helper
 */
function errorResponse(message: string, status: number, corsHeaders?: Headers): Response {
  const headers = corsHeaders || new Headers({
    'Content-Type': 'application/json'
  });

  headers.set('Content-Type', 'application/json');
  
  return new Response(
    JSON.stringify({ 
      status: 'error',
      message 
    }),
    { status, headers }
  );
}

/**
 * Success response helper 
 */
function successResponse(data: any, corsHeaders?: Headers): Response {
  const headers = corsHeaders || new Headers({
    'Content-Type': 'application/json'
  });

  headers.set('Content-Type', 'application/json');
  
  return new Response(
    JSON.stringify({
      status: 'success',
      ...data
    }),
    { status: 200, headers }
  );
}

/**
 * Handle MCP routing request
 */
async function handleMCPRequest(request: Request, env: Env, clientIP: string): Promise<Response> {
  // Get CORS headers
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = generateCorsHeaders(origin, getAllowedOrigins(env.ALLOWED_ORIGINS));
  
  // Parse request body
  let mcpRequest: MCPRequest;
  try {
    mcpRequest = await request.json();
  } catch (error) {
    return errorResponse("Invalid JSON request", 400, corsHeaders);
  }

  // Add request ID if not provided
  const requestId = mcpRequest.requestId || uuidv4();
  mcpRequest.requestId = requestId;

  // Get start time for logging
  const startTime = Date.now();

  // Validate request
  if (!mcpRequest.agent || !mcpRequest.task) {
    return errorResponse("Missing required fields: agent, task", 400, corsHeaders);
  }

  // Validate agent
  if (!Object.keys(ALLOWED_TASKS).includes(mcpRequest.agent)) {
    return errorResponse(`Unknown agent: ${mcpRequest.agent}`, 404, corsHeaders);
  }

  // Validate task
  const agentName = mcpRequest.agent as LINCAgent;
  if (!ALLOWED_TASKS[agentName].includes(mcpRequest.task)) {
    return errorResponse(`Unknown task: ${mcpRequest.task} for agent ${mcpRequest.agent}`, 400, corsHeaders);
  }

  // Get agent endpoints based on environment
  const agentEndpoints = getAgentEndpoints(env.ENVIRONMENT);
  const endpoint = agentEndpoints[agentName];

  // In development, echo back the request
  if (env.ENVIRONMENT === 'development') {
    // Log the request
    await logRequest(env.HEALTHLINC_LOGS, {
      timestamp: startTime,
      requestId,
      agent: mcpRequest.agent,
      task: mcpRequest.task,
      status: 'development-mode',
      duration: Date.now() - startTime,
      clientIP
    });

    return successResponse({
      message: "Development mode - request received",
      agentEndpoint: endpoint,
      request: mcpRequest,
      requestId,
      timestamp: Date.now()
    }, corsHeaders);
  }
  // In production, forward to agent
  try {
    const agentResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-Task': mcpRequest.task,
        'X-Request-ID': requestId
      },
      body: JSON.stringify(mcpRequest.data)
    });

    let responseBody: MCPResponse;
    try {
      responseBody = await agentResponse.json();
    } catch (error) {
      // Log failed response
      await logRequest(env.HEALTHLINC_LOGS, {
        timestamp: startTime,
        requestId,
        agent: mcpRequest.agent,
        task: mcpRequest.task,
        status: 'invalid-response',
        duration: Date.now() - startTime,
        clientIP
      });

      return errorResponse("Invalid response from agent", 502, corsHeaders);
    }

    // Add request ID and timestamp to response if not present
    responseBody.requestId = requestId;
    responseBody.timestamp = responseBody.timestamp || Date.now();
    responseBody.agentResponded = mcpRequest.agent;

    // Log successful request
    await logRequest(env.HEALTHLINC_LOGS, {
      timestamp: startTime,
      requestId,
      agent: mcpRequest.agent,
      task: mcpRequest.task,
      status: agentResponse.ok ? 'success' : 'error',
      duration: Date.now() - startTime,
      clientIP
    });

    // Return with proper CORS headers
    return new Response(JSON.stringify(responseBody), {
      status: agentResponse.status,
      headers: corsHeaders
    });
  } catch (error) {
    // Log error
    await logRequest(env.HEALTHLINC_LOGS, {
      timestamp: startTime,
      requestId,
      agent: mcpRequest.agent,
      task: mcpRequest.task,
      status: 'connection-error',
      duration: Date.now() - startTime,
      clientIP
    });

    return errorResponse("Failed to communicate with agent", 502, corsHeaders);
  }
}

// Define API routes
router.options('*', (request) => {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = generateCorsHeaders(origin, getAllowedOrigins(request.env.ALLOWED_ORIGINS));
  return new Response(null, { headers: corsHeaders });
});

router.post('/query', async (request, env) => {
  // Get client IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // Authorize the request
  const isAuthorized = await authorize(request, env);
  if (!isAuthorized) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = generateCorsHeaders(origin, getAllowedOrigins(env.ALLOWED_ORIGINS));
    return errorResponse("Unauthorized", 401, corsHeaders);
  }

  // Handle MCP request
  return handleMCPRequest(request, env, clientIP);
});

router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// Admin routes for logs (requires auth)
router.get('/admin/logs/:date', async (request, env) => {
  // Authorize the request
  const isAuthorized = await authorize(request, env);
  if (!isAuthorized) {
    return errorResponse("Unauthorized", 401);
  }

  const date = request.params?.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return errorResponse("Invalid date format (required: YYYY-MM-DD)", 400);
  }

  const logs = await getLogsByDate(env.HEALTHLINC_LOGS, date);
  return new Response(JSON.stringify({ logs }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// Not found handler
router.all('*', () => errorResponse("Not Found", 404));

/**
 * Main entry point for the worker
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env);
  },

  // Scheduled task for log cleanup
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanupOldLogs(env.HEALTHLINC_LOGS, LOG_RETENTION_DAYS));
  }
};
