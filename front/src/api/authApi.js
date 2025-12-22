import axios from "axios";

import { API_BASE_URL } from "./config";
// const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPI 서버 주소 (Removed)

export const loginApi = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    return response.data; // TokenPair
  } catch (error) {
    throw error.response?.data?.detail || "Login failed";
  }
};
