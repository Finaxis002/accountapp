// NOTE: This is a mock authentication service for demonstration purposes.
// In a real application, you would use a proper authentication library and a secure backend.

import type { User, Client } from "./types";

const USER_STORAGE_KEY = "accountech_pro_user";
// const baseURL = 'https://account-app-backend-eight.vercel.app';
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export async function loginMasterAdmin(
  username?: string,
  password?: string
): Promise<User | null> {
  if (!username || !password)
    throw new Error("Username and password are required.");

  try {
    const res = await fetch(`${baseURL}/api/master-admin/login`, {
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
      avatar: "/avatars/01.png",
      initials: data.admin.username.substring(0, 2).toUpperCase(),
      role: "master",
      token: data.token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("token", user.token!);
      localStorage.setItem("role", user.role ?? "");
      localStorage.setItem("username", user.username!);
    }
    return user;
  } catch (error) {
    console.error("API login failed:", error);
    throw error;
  }
}

export async function loginCustomer(
  clientUsername: string,
  password: string
): Promise<User> {
  if (!clientUsername || !password) {
    throw new Error("Username and password are required.");
  }

  const res = await fetch(`${baseURL}/api/clients/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientUsername, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  // expect your API to return: { token, client: { clientUsername, slug, contactName, email, ... } }
  const { token, client } = data;

  const user: User = {
    name: client.contactName,
    username: client.clientUsername, // display username
    email: client.email,
    avatar: "/avatars/02.png",
    initials: (client.contactName || "").substring(0, 2).toUpperCase(),
    role: "customer",
    token,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("role", "customer");
    localStorage.setItem("username", client.clientUsername);          // display
    localStorage.setItem("clientUsername", client.clientUsername);    // for logout redirect
    localStorage.setItem("slug", client.slug ?? client.clientUsername); // for /client-login/[slug]
    localStorage.setItem("name", client.contactName || "");
    localStorage.setItem("email", client.email || "");
  }

  return user;
}

export function getCurrentUser(): (User & { clientUsername?: string; slug?: string }) | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as User["role"] | null;
  const username = localStorage.getItem("username");

  if (!token || !role || !username) return null;

  // master admin
  if (role === "master") {
    return {
      name: username,
      username,
      email: `${username}@accountech.com`,
      avatar: "/avatars/01.png",
      initials: username.substring(0, 2).toUpperCase(),
      role: "master",
    };
  }

  // client/customer
  if (role === "customer") {
    const clientUsername = localStorage.getItem("clientUsername") || username;
    const slug = localStorage.getItem("slug") || clientUsername;
    return {
      name: localStorage.getItem("name") || "",
      username,
      email: localStorage.getItem("email") || "",
      avatar: "/avatars/02.png",
      initials: (localStorage.getItem("name") || "").substring(0, 2).toUpperCase(),
      role: "customer",
      clientUsername,
      slug,
    };
  }

  // ✅ employee/admin
  if (role === "admin" || role === "user") {
    return {
      name: username,
      username,
      email: `${username}@accountech.com`, // swap to real email if you store it
      avatar: "/avatars/03.png",
      initials: username.substring(0, 2).toUpperCase(),
      role, // "admin" | "user"
    };
  }

  return null;
}



export async function loginClientBySlug(
  slug: string,
  clientUsername: string,
  password: string
) {
  const res = await fetch(`${baseURL}/api/clients/${slug}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientUsername, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Login failed");

  const user: User = {
    name: data.client.contactName,
    username: data.client.clientUsername,
    email: data.client.email,
    avatar: "/avatars/02.png",
    initials: data.client.contactName.substring(0, 2).toUpperCase(),
    role: "customer",
    token: data.token,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("token", user.token!);
    localStorage.setItem("role", user.role!);
    localStorage.setItem("username", user.username!);
    localStorage.setItem("name", user.name!);
    localStorage.setItem("email", user.email!);
    localStorage.setItem("tenantSlug", slug);
  }

  return user;
}

export async function loginUser(userId: string, password: string): Promise<User> {
  if (!userId || !password) throw new Error("User ID and password are required.");

  const res = await fetch(`${baseURL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "Login failed");

  // Expecting: { token, user: { _id, userName, role, companies, ... } }
  const { token, user } = data;

  const normalized: User = {
    name: user.userName,
    username: user.userName,
    email: `${user.userName}@accountech.com`, // swap to real email if you have it
    avatar: "/avatars/03.png",
    initials: (user.userName || "").substring(0, 2).toUpperCase(),
    role: user.role, // "admin" | "user"
    token,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("role", user.role);
    localStorage.setItem("username", user.userName);

    // Optional extras if you need them later
    if (Array.isArray(user.companies)) {
      localStorage.setItem("companies", JSON.stringify(user.companies));
    }
    if (user.createdByClient) {
      localStorage.setItem("createdByClient", user.createdByClient);
    }
  }

  return normalized;
}




export function logout(): string {
  // read BEFORE clearing
  const role = localStorage.getItem("role");
  const slug =
    localStorage.getItem("tenantSlug") ||
    localStorage.getItem("slug") ||
    localStorage.getItem("clientUsername");

  // clear everything
  localStorage.clear();

  // return the correct target
  return role === "customer" && slug ? `/client-login/${slug}` : "/login";
}
