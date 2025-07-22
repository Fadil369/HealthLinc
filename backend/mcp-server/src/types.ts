/**
 * Types for the MCP Server
 */

export interface MCPRequest {
  agent: string;
  task: string;
  data: any;
  requestId?: string;
}

export interface MCPResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
  requestId?: string;
  agentResponded?: string;
  timestamp: number;
}

export interface LogEntry {
  timestamp: number;
  requestId: string;
  agent: string;
  task: string;
  status: string;
  duration: number;
  clientIP?: string;
}

// LINC Agent types
export type LINCAgent = 'ClaimLinc' | 'RecordLinc' | 'AuthLinc' | 'NotifyLinc' | 'NphiesLinc' | 'MatchLinc' | 'DocuLinc' | 'ClaimTrackerLinc' | 'ReviewerLinc';

// Define allowed tasks per agent
export const ALLOWED_TASKS: Record<LINCAgent, string[]> = {
  'ClaimLinc': ['submit', 'verify', 'dispute', 'check'],
  'RecordLinc': ['create', 'read', 'update', 'delete', 'search'],
  'AuthLinc': ['login', 'verify', 'reset', 'permissions', 'validate'],
  'NotifyLinc': ['alert', 'reminder', 'broadcast', 'send', 'notify'],
  'NphiesLinc': ['process_bundle', 'transform', 'route', 'extract', 'submit_to_nphies'],
  'MatchLinc': ['validate', 'match', 'check_compatibility'],
  'DocuLinc': ['generate', 'enhance', 'template'],
  'ClaimTrackerLinc': ['track', 'status', 'update', 'monitor'],
  'ReviewerLinc': ['review', 'approve', 'reject', 'audit']
};
