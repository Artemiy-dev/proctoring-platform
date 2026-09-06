import axios from 'axios';

export const API_URL = '/api';

const $api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

const $apiPlain = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

$api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let refreshSubscribers = [];

function onRefreshed(newToken) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
}

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

let onAuthFail = () => {};
export function setOnAuthFail(handler) {
    onAuthFail = handler;
}

// Единая точка для запроса /refresh — гарантирует, что одновременно
// выполняется только ОДИН такой запрос на всё приложение
let refreshPromise = null;

export function refreshTokens() {
    if (!refreshPromise) {
        refreshPromise = $apiPlain.get('/refresh')
            .then((response) => {
                const accessToken = response.data.accessToken;
                localStorage.setItem('accessToken', accessToken);
                onRefreshed(accessToken);
                return response.data;
            })
            .catch((err) => {
                onRefreshed(null);
                localStorage.removeItem('accessToken');
                onAuthFail();
                throw err;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

$api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;
        const status = error.response && error.response.status;
        const isRefreshCall = originalRequest.url && originalRequest.url.includes('/refresh');

        if (status === 401 && !originalRequest._retry && !isRefreshCall) {
            originalRequest._retry = true;

            try {
                const data = await refreshTokens();
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return $api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default $api;