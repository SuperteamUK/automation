import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;

export const login = async (secret: string) => {
  const response = await axios({
    headers: {
      'Content-Type': 'application/json',
      'x-user-secret': secret,
    },
    method: 'post',
    url: `${API_BASE_URL}/login`,
  });
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error('Login failed');
  }
};
