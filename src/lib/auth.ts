// NOTE: This is a mock authentication service for demonstration purposes.
// In a real application, you would use a proper authentication library and a secure backend.

import type { User } from './types';

const USER_STORAGE_KEY = 'accountech_pro_user';

const mockUsers: Record<string, User> = {
  'admin@accountech.com': {
    name: 'Master Administrator',
    email: 'admin@accountech.com',
    avatar: '/avatars/01.png',
    initials: 'MA',
    role: 'admin'
  },
  'client@techcorp.com': {
    name: 'TechCorp Client',
    email: 'client@techcorp.com',
    avatar: '/avatars/02.png',
    initials: 'TC',
    role: 'customer'
  },
  'customer@fintrackpro.com': {
    name: 'Customer User',
    email: 'customer@fintrackpro.com',
    avatar: '/avatars/02.png',
    initials: 'CU',
    role: 'customer'
  }
};

export function login(email: string): User | null {
  const user = mockUsers[email] || mockUsers['client@techcorp.com'];
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  }
  return null;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  }
  return null;
}
