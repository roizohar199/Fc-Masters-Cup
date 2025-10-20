/**
 * API Configuration
 * Centralized API base URL and helper functions
 */
export const API_BASE = "/api";

/**
 * Creates a full API URL from a path
 * @param path - API path (with or without leading slash)
 * @returns Full API URL
 * 
 * @example
 * apiUrl('/admin/users') → '/api/admin/users'
 * apiUrl('tournaments') → '/api/tournaments'
 */
export const apiUrl = (path: string): string => {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: apiUrl('/auth/login'),
  LOGOUT: apiUrl('/auth/logout'),
  REGISTER: apiUrl('/auth/register'),
  FORGOT_PASSWORD: apiUrl('/auth/forgot-password'),
  RESET_PASSWORD: apiUrl('/auth/reset-password'),
  
  // Admin
  ADMIN_USERS: apiUrl('/admin/users'),
  ADMIN_USERS_ONLINE: apiUrl('/admin/users/online-status'),
  ADMIN_TOURNAMENTS: apiUrl('/admin/tournaments'),
  ADMIN_DISPUTES: apiUrl('/admin/disputes'),
  
  // Tournaments
  TOURNAMENTS: apiUrl('/tournaments'),
  TOURNAMENT_DETAILS: (id: string) => apiUrl(`/tournaments/${id}`),
  TOURNAMENT_REGISTRATIONS: apiUrl('/tournament-registrations'),
  
  // Matches
  MATCHES: apiUrl('/matches'),
  MATCH_SUBMIT: apiUrl('/matches/submit'),
  MATCH_OVERRIDE: apiUrl('/matches/override'),
  
  // User
  USER_SETTINGS: apiUrl('/user/settings'),
  USER_PROFILE: apiUrl('/user/profile'),
  
  // Disputes
  DISPUTES: apiUrl('/disputes'),
} as const;
