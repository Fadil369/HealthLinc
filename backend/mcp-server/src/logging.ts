/**
 * Logging utilities for MCP Server
 */

import { LogEntry } from './types';

// Log format: logs:YYYY-MM-DD:requestId
const LOG_PREFIX = 'logs:';

export async function logRequest(logStore: KVNamespace, logEntry: LogEntry): Promise<void> {
  const dateStr = new Date(logEntry.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `${LOG_PREFIX}${dateStr}:${logEntry.requestId}`;
  
  await logStore.put(key, JSON.stringify(logEntry), {
    expirationTtl: 60 * 60 * 24 * 30 // 30 days
  });
}

export async function getLogsByDate(
  logStore: KVNamespace,
  date: string,
  limit = 100
): Promise<LogEntry[]> {
  const prefix = `${LOG_PREFIX}${date}`;
  const { keys } = await logStore.list({ prefix, limit });
  
  const logPromises = keys.map(async (key) => {
    const value = await logStore.get(key.name);
    if (value) {
      return JSON.parse(value) as LogEntry;
    }
    return null;
  });
  
  const logs = await Promise.all(logPromises);
  return logs.filter((log): log is LogEntry => log !== null);
}

export async function cleanupOldLogs(logStore: KVNamespace, retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // List all keys with log prefix
  const { keys } = await logStore.list({ prefix: LOG_PREFIX });
  
  let deletedCount = 0;
  for (const key of keys) {
    const dateStr = key.name.split(':')[1];
    const keyDate = new Date(dateStr);
    
    if (keyDate < cutoffDate) {
      await logStore.delete(key.name);
      deletedCount++;
    }
  }
  
  return deletedCount;
}
