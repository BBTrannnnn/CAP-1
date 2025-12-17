import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../stores/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyError } from '../utils/notify';
import { BASE_URL as USER_BASE_URL } from '../server/users';

export const BASE_URL = USER_BASE_URL;

async function getAuthToken(): Promise<string | null> {
    let token = await AsyncStorage.getItem('auth_token');
    if (!token) {
        token = await AsyncStorage.getItem('accessToken');
    }
    return token;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch (error) { }
    }

    if (!res.ok) {
        const status = res.status;
        const message = data?.message || data?.error || `Request failed with status ${status}`;

        if (status === 401 || status === 403) {
            notifyError(
                'Truy cập bị từ chối',
                message || 'Bạn không có quyền thực hiện hoặc phiên đăng nhập đã hết hạn.'
            );
            if (status === 401) {
                // Logout & chuyển về Login
                useAuth.getState().signOut();
                router.replace('/(auth)/login');
            }
        }
        throw { status, message, data };
    }
    return data as T;
}

async function getHeaders(customHeaders: Record<string, string> = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const token = await getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

async function get<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getHeaders();
    const res = await fetch(url, { method: 'GET', headers });
    return handleResponse<T>(res);
}

async function post<T>(endpoint: string, body: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getHeaders();
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
}

async function put<T>(endpoint: string, body: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getHeaders();
    const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
}

async function patch<T>(endpoint: string, body: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getHeaders();
    const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
}

async function del<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getHeaders();
    const res = await fetch(url, {
        method: 'DELETE',
        headers,
    });
    return handleResponse<T>(res);
}

export const client = {
    get,
    post,
    put,
    patch,
    delete: del,
};