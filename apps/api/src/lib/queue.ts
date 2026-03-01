import { Queue, type ConnectionOptions } from 'bullmq';
import { env } from '../config/env';

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

const redisConnection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  db: redisUrl.pathname ? Number(redisUrl.pathname.replace('/', '') || 0) : 0,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
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

