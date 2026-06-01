import type { ReportStatus, Role, WasteType } from "@/lib/types";

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
if (import.meta.env.PROD) {
  API_BASE_URL = API_BASE_URL || "/api";
} else if (!API_BASE_URL || API_BASE_URL.includes("localhost")) {
  API_BASE_URL = `http://${window.location.hostname}:3001/api`;
}

export interface ApiError {
  error: string;
}

export interface ApiUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
  points: number;
}

export interface ApiReport {
  _id: string;
  location: string;
  type: WasteType;
  status: ReportStatus;
  reporter?: string | ApiUser;
  assignedTo?: string | ApiUser;
  createdAt: string;
  rewarded?: boolean;
  description?: string;
  coords: { lat: number; lng: number };
  photo?: string;
}

export interface ApiBin {
  _id: string;
  name: string;
  fill: number;
  type: WasteType;
  coords: { lat: number; lng: number };
  location?: string;
  capacity?: number;
  lastEmptied?: string;
}

export interface ApiWorker {
  _id: string;
  name: string;
  email?: string;
  role?: Role;
  points?: number;
  assignedTasks?: ApiReport[];
}

export interface AssignmentResponse {
  message: string;
  report: ApiReport;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Auth API
export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
    address?: string;
    location?: string;
    swmCode?: string;
  }) =>
    apiCall<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: Role;
        points: number;
      };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiCall<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: Role;
        points: number;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Reports API
export const reportsApi = {
  getAll: (params?: { status?: ReportStatus; type?: WasteType; reporter?: string; assignedTo?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.reporter) query.append("reporter", params.reporter);
    if (params?.assignedTo) query.append("assignedTo", params.assignedTo);
    return apiCall<ApiReport[]>(`/reports${query.toString() ? "?" + query : ""}`);
  },

  getById: (id: string) => apiCall<ApiReport>(`/reports/${id}`),

  create: (data: {
    location: string;
    type: WasteType;
    description?: string;
    coords: { lat: number; lng: number };
    photo?: string;
  }) =>
    apiCall<ApiReport>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { status?: ReportStatus; assignedTo?: string }) =>
    apiCall<ApiReport>(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/reports/${id}`, {
      method: "DELETE",
    }),

  rewardWorker: (id: string) =>
    apiCall<ApiReport>(`/reports/${id}/reward`, {
      method: "POST",
    }),
};

// Bins API
export const binsApi = {
  getAll: (params?: { type?: WasteType }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    return apiCall<ApiBin[]>(`/bins${query.toString() ? "?" + query : ""}`);
  },

  getById: (id: string) => apiCall<ApiBin>(`/bins/${id}`),

  create: (data: {
    name: string;
    type: WasteType;
    coords: { lat: number; lng: number };
    location?: string;
    capacity?: number;
  }) =>
    apiCall<ApiBin>("/bins", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { fill?: number; lastEmptied?: string }) =>
    apiCall<ApiBin>(`/bins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/bins/${id}`, {
      method: "DELETE",
    }),
};

// Users API
export const usersApi = {
  getMe: () => apiCall<ApiUser>("/users/me"),

  getById: (id: string) => apiCall<ApiUser>(`/users/${id}`),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiCall<ApiUser>("/users", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  addPoints: (userId: string, points: number) =>
    apiCall<{ id: string; name: string; points: number }>(
      `/users/${userId}/add-points`,
      {
        method: "POST",
        body: JSON.stringify({ points }),
      }
    ),
};

// Workers API
export const workersApi = {
  getAll: () => apiCall<ApiWorker[]>("/workers"),

  getById: (id: string) => apiCall<ApiWorker>(`/workers/${id}`),

  assign: (workerId: string, reportId: string) =>
    apiCall<AssignmentResponse>(`/workers/${workerId}/assign/${reportId}`, {
      method: "POST",
    }),

  unassign: (workerId: string, reportId: string) =>
    apiCall<ApiWorker>(`/workers/${workerId}/unassign/${reportId}`, {
      method: "POST",
    }),
};
