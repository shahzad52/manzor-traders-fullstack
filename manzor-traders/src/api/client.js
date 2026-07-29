// Talks to the Node/Express + PostgreSQL backend.
// Firebase is used ONLY to authenticate the user — every ID token is sent
// to the backend, which verifies it and then reads/writes PostgreSQL.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Set from App.jsx once Firebase auth is initialized, so this client can
// always attach a fresh ID token without importing firebase/auth here.
let getIdTokenFn = null;
export function setIdTokenProvider(fn) {
  getIdTokenFn = fn;
}

async function request(path, { method = "GET", body } = {}) {
  const token = getIdTokenFn ? await getIdTokenFn() : null;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
