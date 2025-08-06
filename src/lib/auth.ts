
// NOTE: This is a mock authentication service for demonstration purposes.
// In a real application, you would use a proper authentication library and a secure backend.

import type { User, Client } from './types';

const USER_STORAGE_KEY = 'accountech_pro_user';

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

export async function loginCustomer(clientUsername?: string, password?: string): Promise<User | null> {
  if (!clientUsername || !password) throw new Error("Username and password are required.");

  try {
     const res = await fetch("https://account-app-backend-eight.vercel.app/api/clients/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientUsername, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    const user: User = {
        name: data.client.contactName,
        username: data.client.clientUsername,
        email: data.client.email,
        avatar: '/avatars/02.png',
        initials: data.client.contactName.substring(0, 2).toUpperCase(),
        role: 'customer',
        token: data.token
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', user.token!);
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username!);
      localStorage.setItem('name', user.name!);
      localStorage.setItem('email', user.email!);
    }
    
    return user;
  } catch(error) {
    console.error("Client API login failed:", error);
    throw error;
  }
}


export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') as User['role'];
  const username = localStorage.getItem('username');

  if (token && role && username) {
    if (role === 'master') {
        return {
            name: username,
            username: username,
            email: `${username}@accountech.com`,
            avatar: '/avatars/01.png',
            initials: username.substring(0, 2).toUpperCase(),
            role: 'master'
        };
    }
    if (role === 'customer') {
       return {
            name: localStorage.getItem('name') || '',
            username: username,
            email: localStorage.getItem('email') || '',
            avatar: '/avatars/02.png',
            initials: (localStorage.getItem('name') || '').substring(0, 2).toUpperCase(),
            role: 'customer'
        };
    }
  }

  return null;
}
