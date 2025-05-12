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
export type LINCAgent = 'ClaimLinc' | 'RecordLinc' | 'AuthLinc' | 'NotifyLinc';

// Define allowed tasks per agent
export const ALLOWED_TASKS: Record<LINCAgent, string[]> = {
  'ClaimLinc': ['submit', 'verify', 'dispute', 'check'],
  'RecordLinc': ['create', 'read', 'update', 'delete', 'search'],
  'AuthLinc': ['login', 'verify', 'reset', 'permissions'],
  'NotifyLinc': ['alert', 'reminder', 'broadcast']
};
