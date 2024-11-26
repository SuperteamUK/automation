import { WorkerMetrics } from '../types';

const CONTROL_KEY = process.env.REACT_APP_CONTROL_SECRET_KEY;
const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getMetrics = async (): Promise<WorkerMetrics> => {
  const response = await fetch(API_BASE_URL + '/api/worker/metrics', {
    headers: {
      'x-control-key': CONTROL_KEY || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch worker metrics');
  }
  return response.json();
};

export const startWorker = async (): Promise<void> => {
  const response = await fetch(API_BASE_URL + '/api/worker/start', {
    method: 'POST',
    headers: {
      'x-control-key': CONTROL_KEY || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to start worker');
  }
};

export const stopWorker = async (): Promise<void> => {
  const response = await fetch(API_BASE_URL + '/api/worker/stop', {
    method: 'POST',
    headers: {
      'x-control-key': CONTROL_KEY || '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to stop worker');
  }
};
