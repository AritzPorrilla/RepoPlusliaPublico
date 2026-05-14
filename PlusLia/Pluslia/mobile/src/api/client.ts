import axios from 'axios';

const API_BASE_URL = 'http://172.80.20.31:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
