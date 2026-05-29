import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL;

function getDefaultBaseUrl() {
  if (typeof window === 'undefined' || !window.location) return 'http://localhost:3000';
  const port = window.location.port;
  if (port === '5173' || port === '4173') return 'http://localhost:3000';
  return window.location.origin;
}

export const API_BASE_URL = (rawBaseUrl || getDefaultBaseUrl()).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function apiUrl(pathname) {
  if (!pathname) return API_BASE_URL;
  if (pathname.startsWith('http://') || pathname.startsWith('https://')) return pathname;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${path}`;
}
