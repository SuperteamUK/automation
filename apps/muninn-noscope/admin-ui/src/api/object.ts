import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const listObjects = async (params?: {
  id?: string;
  limit?: number;
  offset?: number;
}): Promise<any> => {
  const searchParams = new URLSearchParams();
  if (params) {
    window.Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });
  }
  const response = await axios.get(`${API_BASE_URL}/objects?${searchParams}`);
  return response.data;
};
