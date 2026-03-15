import { Queue, type ConnectionOptions } from 'bullmq';
import { env } from '../config/env.js';

declare global {
  var analysisQueueGlobal:
    | Queue<AnalysisQueueJobData, void, AnalysisQueueJobName>
    | undefined;
}

export interface AnalysisQueueJobData {
  analysisRunId: string;
  eventId: string;
  repositoryId: string;
}

export type AnalysisQueueJobName = 'process-analysis';

const redisUrl = new URL(env.REDIS_URL);
const useTls = redisUrl.protocol === 'rediss:';
const db = Number(redisUrl.pathname.replace('/', '') || 0);

const redisConnection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  db: Number.isFinite(db) ? db : 0,
  username: redisUrl.username
    ? decodeURIComponent(redisUrl.username)
    : undefined,
  password: redisUrl.password
    ? decodeURIComponent(redisUrl.password)
    : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  ...(useTls ? { tls: {} } : {}),
};

export const analysisQueue =
  globalThis.analysisQueueGlobal ??
  new Queue<AnalysisQueueJobData, void, AnalysisQueueJobName>('analysis-jobs', {
    connection: redisConnection,
  });

analysisQueue.on('error', (error) => {
  console.error('Analysis queue error:', error);
});

analysisQueue.on('ioredis:close', () => {
  console.warn('Analysis queue Redis connection closed');
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.analysisQueueGlobal = analysisQueue;
}

