import axios from 'axios';
import { Task } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL;
interface TaskResponse {
  tasks: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const listTasks = async (params?: {
  object_id?: string;
  status?: Task['status'];
  limit?: number;
  offset?: number;
}): Promise<TaskResponse> => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });
  }
  const response = await axios.get(`${API_BASE_URL}/tasks?${searchParams}`);
  return response.data;
};

export const createTask = async (data: {
  object_id: string;
  input: Record<string, any>;
}): Promise<Task> => {
  const response = await axios.post(`${API_BASE_URL}/tasks`, data);
  return response.data;
};
