import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cấu hình BASE_URL
 * → Theo yêu cầu: dùng cố định 192.168.1.155:5000
 */
const BASE_URL = 'http://192.168.1.7:5000';

export function setBaseUrl(url) {
  // nếu muốn override thủ công thì vẫn hỗ trợ
  BASE_URL = url;
}

// ===== Token helpers =====
const TOKEN_KEY = 'auth_token';

export function buildQuery(params) {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => sp.append(k, String(item)));
    } else {
      sp.append(k, String(v));
    }
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}
async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ===== Request helper =====
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
        const err = new Error('Missing auth token');
        err.status = 401;
        throw err;
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {}

    console.log('status:', res.status);
    console.log('response:', data);

    if (!res.ok) {
      const err = new Error(data?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    console.error('error:', { status: err?.status, data: err?.data || err });
    throw err;
  } finally {
    console.groupEnd?.();
  }
}

// ======== API (giữ nguyên) ========
export async function register({ name, email, phone, password, confirmPassword }) {
  const data = await apiRequest('/api/users/register', {
    method: 'POST',
    body: { name, email, phone, password, confirmPassword },
  });
  if (data?.token) await setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const label = `[users.login]#${reqId}`;
  const started = Date.now();

  const body = { email, password };

  if (__DEV__) {
    console.groupCollapsed(`${label} -> POST /api/users/login`);
    console.log('request.body:', { ...body, password: '***' });
  }

  try {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body,
    });

    if (__DEV__) console.log(`${label} response:`, data);

    const token =
      data?.token ||
      data?.accessToken ||
      data?.data?.token;

    if (token) {
      await setToken(token);
    }

    return data;
  } catch (err) {
    if (__DEV__) {
      console.error(`${label} error.status:`, err?.status);
      console.error(`${label} error.data:`, err?.data || err);
    }
    throw err;
  } finally {
    if (__DEV__) {
      console.log(`${label} duration: ${Date.now() - started}ms`);
      console.groupEnd?.();
    }
  }
}

export async function logout() {
  try {
    await apiRequest('/api/users/logout', { method: 'POST', auth: true });
  } finally {
    await clearToken();
  }
  return { message: 'Logged out locally' };
}

export async function forgotPassword(emailOrObj) {
  const raw = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj?.email;
  const email = String(raw || '').trim().toLowerCase();

  const url = `/api/users/forgotpassword?email=${encodeURIComponent(email)}`;

  return apiRequest(url, { method: 'POST' });
}

export async function verifyOTP({ email, otp }) {
  return apiRequest('/api/users/verifyOTP', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), otp },
  });
}

export async function resetPassword({ email, password, confirmPassword }) {
  return apiRequest('/api/users/resetpassword', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    },
  });
}

export async function getMe() {
  return apiRequest('/api/users/me', { auth: true });
}

export async function isLoggedIn() {
  return Boolean(await getToken());
}
