/**
 * Configuration and environment settings
 */

import { LINCAgent } from './types';

// Agent endpoints based on environment
const PRODUCTION_ENDPOINTS: Record<LINCAgent, string> = {
  'ClaimLinc': 'https://api.healthlinc.app/agents/claim',
  'RecordLinc': 'https://api.healthlinc.app/agents/record',
  'AuthLinc': 'https://api.healthlinc.app/agents/auth',
  'NotifyLinc': 'https://api.healthlinc.app/agents/notify'
};

const DEVELOPMENT_ENDPOINTS: Record<LINCAgent, string> = {
  'ClaimLinc': 'http://localhost:3001/agents/claim',
  'RecordLinc': 'http://localhost:3002/agents/record',
  'AuthLinc': 'http://localhost:3003/agents/auth',
  'NotifyLinc': 'http://localhost:3004/agents/notify'
};

export function getAgentEndpoints(env: string): Record<LINCAgent, string> {
  return env === 'production' ? PRODUCTION_ENDPOINTS : DEVELOPMENT_ENDPOINTS;
}

// Logger configuration
export const LOG_RETENTION_DAYS = 30; // How long to keep logs in KV

// Security settings
export function getAllowedOrigins(originsString: string): string[] {
  return originsString.split(',');
}
