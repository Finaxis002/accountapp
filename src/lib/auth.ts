
// NOTE: This is a mock authentication service for demonstration purposes.
// In a real application, you would use a proper authentication library and a secure backend.

import type { User } from './types';

const USER_STORAGE_KEY = 'accountech_pro_user';

const mockUsers: Record<string, User> = {
  'masteradmin': {
    username: 'masteradmin',
    name: 'Master Administrator',
    email: 'admin@accountech.com',
    avatar: '/avatars/01.png',
    initials: 'MA',
    role: 'master'
  },
  'techcorpclient': {
    username: 'techcorpclient',
    name: 'TechCorp Client',
    email: 'client@techcorp.com',
    avatar: '/avatars/02.png',
    initials: 'TC',
    role: 'customer'
  },
};

export async function loginMasterAdmin(username?: string, password?: string): Promise<User | null> {
  if (!username || !password) throw new Error("Username and password are required.");
  
  try {
    const res = await fetch("http://localhost:5000/api/master-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    const user: User = {
      name: data.admin.username,
      username: data.admin.username,
      email: `${data.admin.username}@accountech.com`,
      avatar: '/avatars/01.png',
      initials: data.admin.username.substring(0, 2).toUpperCase(),
      role: 'master',
      token: data.token
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', user.token!);
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username!);
    }

    return user;
  } catch (error) {
    console.error("API login failed:", error);
    throw error;
  }
}

export async function loginCustomer(username?: string, password?: string): Promise<User | null> {
  if (!username || !password) throw new Error("Username and password are required.");

  const user = mockUsers[username];
  
  // In a real app, you would also check the password here.
  // For this mock, we just check if the user exists.
  if (user && user.role === 'customer') { 
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  }
  
  throw new Error("Invalid customer credentials.");
}


export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  if (token && role === 'master' && username) {
    return {
      name: username,
      username: username,
      email: `${username}@accountech.com`,
      avatar: '/avatars/01.png',
      initials: username.substring(0, 2).toUpperCase(),
      role: 'master'
    };
  }

  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as User;
      // Make sure the role is correct for demo users
      if (user.username === 'masteradmin') user.role = 'master';
      return user;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  }

  return null;
}
