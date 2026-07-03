import axios from 'axios';

const API_BASE_URL = 'https://localhost:7241/api/Auth';

export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    email,
    password,
  });
  return response.data;
};

export const register = async (fullName, email, phoneNumber, password, role) => {
  const response = await axios.post(`${API_BASE_URL}/register`, {
    fullName,
    email,
    phoneNumber,
    password,
    role,
  });
  return response.data;
};