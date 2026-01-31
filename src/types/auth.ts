export interface User {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: "admin" | "member";
  visibleTabs?: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
}
