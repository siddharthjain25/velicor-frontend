const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

export interface LogEntry {
  timestamp?: string;
  service_name?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL';
  status_code?: number;
  message: string;
  metadata?: Record<string, any>;
}

export interface Service {
  _id: string;
  name: string;
  secret_key: string;
  retention_days: number;
  created_at: string;
}

export interface User {
  _id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export async function ingestLogs(logs: LogEntry | LogEntry[], apiKey: string) {
  const response = await fetch(`${BASE_URL}/api/v1/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(logs),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to ingest logs: ${response.statusText}`);
  }

  return response.json();
}

export async function register(username: string, password: string, first_name?: string, last_name?: string) {
  const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, first_name, last_name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  return response.json();
}

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

export async function updateUserProfile(token: string, data: { first_name?: string, last_name?: string, password?: string }): Promise<User> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update profile');
  }
  return response.json();
}

export async function deleteAccount(token: string) {
  const response = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete account');
  }
  return true;
}

export async function login(username: string, password: string) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${BASE_URL}/api/v1/auth/token`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  return response.json();
}

export async function getServices(token: string) {
  const response = await fetch(`${BASE_URL}/api/v1/services/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
}

export async function createService(token: string, name: string) {
  const response = await fetch(`${BASE_URL}/api/v1/services/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create service');
  }
  return response.json();
}

export async function updateService(token: string, serviceId: string, data: { retention_days: number }) {
  const response = await fetch(`${BASE_URL}/api/v1/services/${serviceId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update service');
  }
  return response.json();
}

export async function deleteService(token: string, serviceId: string) {
  const response = await fetch(`${BASE_URL}/api/v1/services/${serviceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete service');
  }
  return true;
}

export async function resetServiceKey(token: string, serviceId: string) {
  const response = await fetch(`${BASE_URL}/api/v1/services/${serviceId}/reset-key`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reset API key');
  }
  return response.json();
}

export async function getServiceStats(token: string, serviceId: string, intervalHours: number = 24) {
  const response = await fetch(`${BASE_URL}/api/v1/services/${serviceId}/stats?interval_hours=${intervalHours}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch service stats');
  return response.json();
}

export async function getWebhooks(token: string) {
  const response = await fetch(`${BASE_URL}/api/v1/webhooks/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch global webhooks');
  return response.json();
}

export async function addWebhook(token: string, webhook: { url: string, levels: string[], keywords?: string[], services?: string[] }) {
  const response = await fetch(`${BASE_URL}/api/v1/webhooks/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(webhook),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add webhook');
  }
  return response.json();
}

export async function deleteWebhook(token: string, webhookId: string) {
  const response = await fetch(`${BASE_URL}/api/v1/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete webhook');
  return true;
}

export async function updateWebhook(token: string, webhookId: string, data: { url?: string, levels?: string[], services?: string[] }) {
  const response = await fetch(`${BASE_URL}/api/v1/webhooks/${webhookId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update webhook');
  }
  return response.json();
}

export async function searchLogs(apiKey: string, filters: {
  start_ts?: string;
  end_ts?: string;
  level?: string;
  status_code?: number;
  keyword?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`${BASE_URL}/api/v1/search?${params.toString()}`, {
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}
