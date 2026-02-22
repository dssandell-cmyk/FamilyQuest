const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('fq_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('fq_token', token);
  } else {
    localStorage.removeItem('fq_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Auth ---
export const api = {
  auth: {
    register: (name: string, password: string) =>
      request<{ token: string; user: ApiUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
      }),
    login: (name: string, password: string) =>
      request<{ token: string; user: ApiUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
      }),
    me: () => request<ApiUser>('/api/auth/me'),
  },

  families: {
    create: (name: string) =>
      request<{ family: ApiFamily; user: ApiUser }>('/api/families', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    join: (code: string) =>
      request<{ family: ApiFamily; user: ApiUser }>('/api/families/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    current: () =>
      request<{ family: ApiFamily | null; members: ApiUser[] }>('/api/families/current'),
    updateUserRole: (userId: string, role: string) =>
      request<{ success: boolean }>(`/api/families/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
  },

  tasks: {
    list: () => request<ApiTask[]>('/api/tasks'),
    create: (data: {
      title: string;
      description: string;
      basePoints: number;
      userPointsOverride: Record<string, number>;
      bookingDeadline: number;
      completionDeadline: number;
      isBossTask?: boolean;
      referenceImage?: string | null;
    }) =>
      request<ApiTask>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    claim: (id: string) =>
      request<{ success: boolean }>(`/api/tasks/${id}/claim`, { method: 'PUT' }),
    complete: (id: string, data?: { completionImage?: string; imageMatchScore?: number }) =>
      request<{ success: boolean }>(`/api/tasks/${id}/complete`, {
        method: 'PUT',
        body: JSON.stringify(data || {}),
      }),
    verify: (id: string) =>
      request<{ success: boolean }>(`/api/tasks/${id}/verify`, { method: 'PUT' }),
    update: (id: string, data: {
      title?: string;
      description?: string;
      basePoints?: number;
      userPointsOverride?: Record<string, number>;
      bookingDeadline?: number;
      completionDeadline?: number;
    }) =>
      request<ApiTask>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
  },

  proposals: {
    list: () => request<ApiProposal[]>('/api/proposals'),
    create: (data: { title: string; description: string; suggestedPoints: number }) =>
      request<ApiProposal>('/api/proposals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reject: (id: string) =>
      request<{ success: boolean }>(`/api/proposals/${id}`, { method: 'DELETE' }),
    approve: (id: string, finalPoints: number, userPointsOverride: Record<string, number>) =>
      request<{ success: boolean }>(`/api/proposals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ finalPoints, userPointsOverride }),
      }),
  },

  sideQuests: {
    list: () => request<ApiSideQuest[]>('/api/side-quests'),
    create: (data: { assignedTo: string; title: string; description: string; durationHours: number }) =>
      request<ApiSideQuest>('/api/side-quests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    respond: (id: string, accepted: boolean) =>
      request<{ success: boolean }>(`/api/side-quests/${id}/respond`, {
        method: 'PUT',
        body: JSON.stringify({ accepted }),
      }),
    complete: (id: string) =>
      request<{ success: boolean }>(`/api/side-quests/${id}/complete`, { method: 'PUT' }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/side-quests/${id}`, { method: 'DELETE' }),
  },
};

// API types
export interface ApiUser {
  id: string;
  name: string;
  role: string;
  score: number;
  avatar: string;
  level: number;
  familyId: string | null;
}

export interface ApiFamily {
  id: string;
  name: string;
  inviteCode: string;
}

export interface ApiTask {
  id: string;
  familyId: string;
  title: string;
  description: string;
  basePoints: number;
  userPointsOverride: Record<string, number>;
  status: string;
  assigneeId: string | null;
  createdBy: string;
  createdAt: number;
  bookingDeadline: number;
  completionDeadline: number;
  isBossTask: boolean;
  referenceImage?: string | null;
  completionImage?: string | null;
  imageMatchScore?: number | null;
}

export interface ApiProposal {
  id: string;
  familyId: string;
  title: string;
  description: string;
  suggestedPoints: number;
  proposedBy: string;
  createdAt: number;
}

export interface ApiSideQuest {
  id: string;
  familyId: string;
  assignedTo: string;
  title: string;
  description: string;
  status: string;
  createdAt: number;
  expiresAt: number;
}
