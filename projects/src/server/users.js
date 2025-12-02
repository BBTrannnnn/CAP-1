// ==========================
//  USER API CLIENT (MERGED)
// ==========================

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =======================================
// BASE URL (tự động detect theo platform)
// =======================================
let BASE_URL = 'http://localhost:5000';

export function setBaseUrl(url) {
  BASE_URL = url;
  console.log('[API BASE]', BASE_URL);
}

// =======================================
// TOKEN STORAGE
// =======================================
export async function getToken() {
  const t = await AsyncStorage.getItem('accessToken');
  if (t) return t;
  return AsyncStorage.getItem('auth_token');
}

export async function setToken(token) {
  await AsyncStorage.setItem('accessToken', token);
  await AsyncStorage.setItem('auth_token', token);
}

export async function clearToken() {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('auth_token');
}


// =======================================
// Lõi gọi API – KHÔNG được đổi nữa
// =======================================
export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const label = `[apiRequest] ${method} ${path}`;
  let maskedBody = body;
  if (body && typeof body === 'object') {
    try {
      maskedBody = JSON.parse(JSON.stringify(body));
      Object.keys(maskedBody).forEach((k) => {
        if (String(k).toLowerCase().includes('password')) {
          maskedBody[k] = '***';
        }
      });
    } catch {}
  }

  console.groupCollapsed?.(label);
  console.log('request:', { method, path, auth, body: maskedBody });

  try {
    if (auth) {
      const token = await getToken();
      if (!token) {
        console.groupEnd?.();
        throw new Error('No auth token, please login first');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn('Cannot parse JSON, raw text:', text);
      throw new Error(`Invalid JSON from server: ${e.message}`);
    }

    console.log('response status:', res.status);
    console.log('response body:', json);

    if (!res.ok) {
      const msg =
        (json && (json.message || json.error)) ||
        `Request failed with status ${res.status}`;
      throw new Error(msg);
    }

    console.groupEnd?.();
    return json;
  } catch (err) {
    console.error('API error:', err);
    console.groupEnd?.();
    throw err;
  }
}

// =======================================
// AUTH – LOGIN / REGISTER / LOGOUT
// =======================================

export async function register(payload) {
  const res = await apiRequest('/api/users/register', {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: payload.role || 'user',
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      address: payload.address,
    },
  });
  return res;
}

export async function login({ email, password }) {
  const res = await apiRequest('/api/users/login', {
    method: 'POST',
    body: { email, password },
  });

  // BE có thể trả token ở nhiều nơi → hỗ trợ tất cả
  const token =
    res?.token ||
    res?.data?.token ||
    res?.accessToken ||
    res?.data?.accessToken;

  if (!token) throw new Error('Token missing in response');

  await setToken(token);
  return res;
}

export async function logout() {
  try {
    await apiRequest('/api/users/logout', { method: 'POST', auth: true });
  } finally {
    await clearToken();
  }
}

export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

// =======================================
//  QUÊN MẬT KHẨU
// =======================================
export async function forgotPassword(email) {
  return apiRequest('/api/users/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyOTP({ email, otp }) {
  return apiRequest('/api/users/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });
}

export async function resetPassword({ email, password, confirmPassword }) {
  return apiRequest('/api/users/reset-password', {
    method: 'POST',
    body: { email, password, confirmPassword },
  });
}

// =======================================
// PROFILE / USER INFO
// =======================================

// Lấy thông tin user hiện tại
export async function getProfile() {
  return apiRequest('/api/users/me', { auth: true });
}

// Lấy info user bất kỳ (admin dùng)
export async function getUserById(userId) {
  return apiRequest(`/api/users/${userId}`, { auth: true });
}

// Cập nhật name / email / phone
export async function updateProfile(userId, payload) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

// Cập nhật dateOfBirth / gender / address
export async function updateAdditionalInfo({ id, dateOfBirth, gender, address }) {
  return apiRequest(`/api/users/${id}/addinfor`, {
    method: 'PUT',
    auth: true,
    body: {
      dateOfBirth,
      gender,
      address,
    },
  });
}

// =======================================
// ADMIN – USER MANAGEMENT
// =======================================

// Lấy danh sách user (có phân trang)
export async function getAllUsers({ page = 1, limit = 20 } = {}) {
  return apiRequest(`/api/users?page=${page}&limit=${limit}`, {
    auth: true,
  });
}

// Admin tạo tài khoản
export async function adminCreateUser(payload) {
  return apiRequest('/api/users/register', {
    method: 'POST',
    auth: true,
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: payload.role || 'user',
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      address: payload.address,
    },
  });
}

// Admin đổi vai trò user
export async function updateUserRoleApi(userId, role) {
  return apiRequest(`/api/users/${userId}/role`, {
    method: 'PATCH',
    auth: true,
    body: { role },
  });
}

// Admin xóa user
export async function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'DELETE',
    auth: true,
  });
}
// =======================================
// UTILS (CẦN THÊM ĐỂ FIX HABITS)
// =======================================
export function buildQuery(obj = {}) {
  const esc = encodeURIComponent;
  const q = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null)
    .map((k) => `${esc(k)}=${esc(obj[k])}`)
    .join('&');
  return q ? `?${q}` : '';
}