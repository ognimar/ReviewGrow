import { auth } from './firebase';

const API_BASE = '/api';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function syncUser() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/auth/sync`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw new Error('Failed to sync user');
  return response.json();
}

export async function fetchCurrentUser() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/auth/me`, { headers });
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export async function fetchClients() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/clients`, { headers });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

export async function importClientsCSV(file: File) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const token = await user.getIdToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/clients/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) throw new Error('Failed to import CSV');
  return response.json();
}

export async function fetchCampaigns() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/campaigns`, { headers });
  if (!response.ok) throw new Error('Failed to fetch campaigns');
  return response.json();
}

export async function createCampaign(data: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create campaign');
  return response.json();
}

export async function fetchStats() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/stats`, { headers });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function createCheckoutSession(plan: 'monthly' | 'yearly') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/billing/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) throw new Error('Failed to create checkout session');
  return response.json();
}

export async function fetchAdminUsers() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/admin/users`, { headers });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}
