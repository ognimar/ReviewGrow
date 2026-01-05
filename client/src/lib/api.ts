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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch clients');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : data.clients || [];
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch campaigns');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : data.campaigns || [];
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create checkout session');
  }
  return response.json();
}

export async function fetchAdminUsers() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/admin/users`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch users');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : data.users || [];
}

export async function fetchTemplates() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/templates`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch templates');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : data.templates || [];
}

export async function createTemplate(formData: FormData) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create template');
  }
  return response.json();
}

export async function deleteTemplate(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('Failed to delete template');
  return response.json();
}
