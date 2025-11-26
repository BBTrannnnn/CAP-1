// users.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cấu hình BASE_URL
 * - Điện thoại thật: nên set EXPO_PUBLIC_API_URL (app.json) → ví dụ: "http://192.168.1.23:5000"
 * - Android emulator: dùng 10.0.2.2
 * - iOS simulator: localhost
 */
const EMU_ANDROID = 'http://10.0.2.2:5000';
const IOS_SIM = 'http://localhost:5000';
const ENV_BASE = process.env.EXPO_PUBLIC_API_URL; // ưu tiên nếu có

let BASE_URL =
  ENV_BASE ||
  (Platform.OS === 'android' ? EMU_ANDROID : IOS_SIM);

export function setBaseUrl(url) {
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
    } catch {
      // no body or not JSON
    }

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

// ===== API functions =====

/** POST /api/users/register  body: { name, email, password } */
// users.ts / users.js
// ... giữ nguyên các phần setBaseUrl, apiRequest, token helpers

/** POST /api/users/register  body: { name, email, phon, password, confirmPassword } */
export async function register({
  name,
  email,
  phone,                // 👈 key theo yêu cầu
  password,
  confirmPassword,     // 👈 key theo yêu cầu
}){
  const data = await apiRequest('/api/users/register', {
    method: 'POST',
    body: { name, email, phone, password, confirmPassword },
  });
  if (data?.token) await setToken(data.token);
  return data;
}


/** POST /api/users/login  body: { email, password } */
export async function login({ email, password }) {
  // Chuẩn hoá & chuẩn bị log
  const reqId = Math.random().toString(36).slice(2, 8);
  const label = `[users.login]#${reqId}`;
  const started = Date.now();

  const body = {
    email: email,
    password, // sẽ mask khi log
  };

  if (__DEV__) {
    console.groupCollapsed(`${label} -> POST /api/users/login`);
    console.log('request.body:', { ...body, password: '***' });
  }

  try {
    // GỌI API
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body,
    });

    // LOG RESPONSE
    if (__DEV__) {
      console.log(`${label} response:`, data);
    }

    // BẮT NHIỀU KIỂU TOKEN
    const token =
      data?.token ||          // { token: '...' }
      data?.accessToken ||    // { accessToken: '...' }
      data?.data?.token;      // { data: { token: '...' } }

    if (token) {
      await setToken(token);
      if (__DEV__) {
        console.log(`${label} token saved:`, `${String(token).slice(0, 10)}…`);
      }
    } else if (__DEV__) {
      console.warn(`${label} no token found in response`);
    }

    return data;
  } catch (err) {
    // LOG LỖI RÕ RÀNG
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


/** POST /api/users/logout  header: Bearer <token> */
export async function logout() {
  try {
    await apiRequest('/api/users/logout', { method: 'POST', auth: true });
  } finally {
    // Dù API có lỗi vẫn xoá token local để đảm bảo đăng xuất trên máy
    await clearToken();
  }
  return { message: 'Logged out locally' };
}

// src/server/users.js

// POST /api/users/forgotpassword?email=...
export async function forgotPassword(emailOrObj) {
  const raw = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj?.email;
  const email = String(raw || '').trim().toLowerCase();

  console.groupCollapsed('[users.forgotPassword]');
  console.log('→ email:', email);

  if (!email) {
    console.groupEnd();
    throw new Error('Email is required');
  }

  const url = `/api/users/forgotpassword?email=${encodeURIComponent(email)}`;
  try {
    const data = await apiRequest(url, { method: 'POST' }); // KHÔNG body
    console.log('← res:', data);
    return data;
  } catch (err) {
    console.error('× err:', err?.status, err?.data || err);
    throw err;
  } finally {
    console.groupEnd();
  }
}

/** POST /api/users/verifyOTP   body: { email, otp } */
export async function verifyOTP({ email, otp }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanOtp   = String(otp || '').trim();

  console.groupCollapsed('[users.verifyOTP]');
  console.log('→ body:', { email: cleanEmail, otp: cleanOtp });

  if (!cleanEmail || !cleanOtp) {
    console.groupEnd();
    throw new Error('Email and OTP are required');
  }

  try {
    const data = await apiRequest('/api/users/verifyOTP', {
      method: 'POST',
      body: { email: cleanEmail, otp: cleanOtp },
    });
    console.log('← res:', data);
    return data;
  } catch (err) {
    console.error('× err:', err?.status, err?.data || err);
    throw err;
  } finally {
    console.groupEnd();
  }
}

/** POST /api/users/resetpassword  body: { email, password, confirmPassword } */
export async function resetPassword({ email, password, confirmPassword }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const pw  = password;
  const cpw = confirmPassword;

  console.groupCollapsed('[users.resetPassword]');
  console.log('→ body:', { email: cleanEmail, len_pw: pw, len_cpw: cpw });

  if (!cleanEmail || !pw || !cpw) {
    console.groupEnd();
    throw new Error('Email, password and confirmPassword are required');
  }

  try {
    const data = await apiRequest('/api/users/resetpassword', {
      method: 'POST',
      body: { email: cleanEmail, password: pw, confirmPassword: cpw },
    });
    console.log('← res:', data);
    return data;
  } catch (err) {
    console.error('× err:', err?.status, err?.data || err);
    throw err;
  } finally {
    console.groupEnd();
  }
}



/** GET /api/users/me  (ví dụ route cần auth) */
export async function getMe() {
  return apiRequest('/api/users/me', { auth: true });
}

/** Tiện ích: kiểm tra đăng nhập (có token local chưa) */
export async function isLoggedIn() {
  return Boolean(await getToken());
}
