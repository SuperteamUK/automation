import axios from 'axios';
import { ListObjectsRow, ObjectDetail } from '../types';
import { trim } from 'lodash';

const MUNINN_API = process.env.REACT_APP_MUNINN_API_URL;
const BOT_JWT = process.env.REACT_APP_MUNINN_JWT;

// fetch
export const crawlObject = async (object_id: string): Promise<any> => {};

export interface ListObjectResponse {
  objects: ListObjectsRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const searchObjects = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<ListObjectResponse> => {
  let searchQuery = search ? trim(search) : '';
  if (searchQuery === '') {
    return {
      objects: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    };
  }
  searchQuery = searchQuery.replaceAll(' ', '&');
  const response = await axios.get(
    `${MUNINN_API}/objects?search=${searchQuery}&page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${BOT_JWT}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const getObjectDetail = async (
  object_id: string
): Promise<ObjectDetail> => {
  const response = await axios.get(`${MUNINN_API}/objects/${object_id}`, {
    headers: {
      Authorization: `Bearer ${BOT_JWT}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};