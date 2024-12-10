import { WorkerMetrics } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getMetrics = async (secret: string): Promise<WorkerMetrics> => {
  const response = await fetch(API_BASE_URL + '/api/worker/metrics', {
    headers: {
      'x-control-key': secret || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch worker metrics');
  }
  return response.json();
};

export const startWorker = async (secret: string): Promise<void> => {
  const response = await fetch(API_BASE_URL + '/api/worker/start', {
    method: 'POST',
    headers: {
      'x-control-key': secret || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to start worker');
  }
};

export const stopWorker = async (secret: string): Promise<void> => {
  const response = await fetch(API_BASE_URL + '/api/worker/stop', {
    method: 'POST',
    headers: {
      'x-control-key': secret || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to stop worker');
  }
};
