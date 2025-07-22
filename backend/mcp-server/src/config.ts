/**
 * Configuration and environment settings
 */

import { LINCAgent } from './types';

// Agent endpoints based on environment
const PRODUCTION_ENDPOINTS: Record<LINCAgent, string> = {
  'ClaimLinc': 'https://claimlinc.healthlinc.workers.dev',
  'RecordLinc': 'https://recordlinc.healthlinc.workers.dev',
  'AuthLinc': 'https://authlinc.healthlinc.workers.dev',
  'NotifyLinc': 'https://notifylinc.healthlinc.workers.dev',
  'NphiesLinc': 'https://nphieslinc.healthlinc.workers.dev',
  'MatchLinc': 'https://matchlinc.healthlinc.workers.dev',
  'DocuLinc': 'https://doculinc.healthlinc.workers.dev',
  'ClaimTrackerLinc': 'https://claimtrackerlinc.healthlinc.workers.dev',
  'ReviewerLinc': 'https://reviewerlinc.healthlinc.workers.dev'
};

const DEVELOPMENT_ENDPOINTS: Record<LINCAgent, string> = {
  'ClaimLinc': 'http://localhost:3001/agents/claim',
  'RecordLinc': 'http://localhost:3007/agents/record',
  'AuthLinc': 'http://localhost:3003/agents/auth',
  'NotifyLinc': 'http://localhost:3006/agents/notify',
  'NphiesLinc': 'http://localhost:3009/agents/nphies',
  'MatchLinc': 'http://localhost:3004/agents/match',
  'DocuLinc': 'http://localhost:3005/agents/docu',
  'ClaimTrackerLinc': 'http://localhost:3008/agents/claimtracker',
  'ReviewerLinc': 'http://localhost:3002/agents/reviewer'
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
