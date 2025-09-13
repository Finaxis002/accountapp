"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import UserSidebar from "@/components/sidebar/UserSidebar";
import { UserNav } from "@/components/layout/user-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Moon,
  Bell,
  FileText,
  DollarSign,
  Clock,
  Loader2,
  HistoryIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { CompanyProvider } from "@/contexts/company-context";
import { PermissionProvider } from "@/contexts/permission-context";
// imports (top)
import { UserPermissionsProvider } from "@/contexts/user-permissions-context";
import axios from "axios"; // 🆕
import { jwtDecode } from "jwt-decode"; // 🆕
import Notification from "@/components/notifications/Notification";
import HistoryPage from "./admin/history/page";

type Decoded = { exp: number; id: string; role: string }; // 🆕

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dateString, setDateString] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ✅ treat these as public routes: do NOT wrap, do NOT redirect
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/user-login" ||
    pathname.startsWith("/client-login/") ||
    pathname.startsWith("/user-login/");

  useEffect(() => {
    if (isAuthRoute) {
      // skip auth checks completely on auth pages
      setIsLoading(false);
      return;
    }

    const today = new Date();
    setDateString(
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    const user = getCurrentUser();
    if (!user) {
      // protected app page → go to generic login
      router.replace("/login");
      setIsLoading(false);
      return;
    }

    setCurrentUser(user);
    setIsLoading(false);
  }, [router, pathname, isAuthRoute]);

 // Handle click on History Icon
  const handleHistoryClick = () => {
    if (role === "master") {
      // Navigate to /admin/history if the user is a master
      router.push("/admin/history");
    }
  };

  const handleCloseHistoryPage = () => {
    setShowHistoryPage(false); // Hide the history page when needed (e.g., close button)
  };

  const handleLogout = () => {
    // read BEFORE clearing
    const role = localStorage.getItem("role");
    const slug =
      localStorage.getItem("tenantSlug") ||
      localStorage.getItem("slug") ||
      localStorage.getItem("clientUsername");

    // clear everything
    localStorage.clear();
    // console.debug("Logout redirect →", role, slug);

    // 🔑 redirect logic
    if (role === "customer" && slug) {
      // customer → their own client login page
      window.location.assign(`/client-login/${slug}`);
    } else if (role === "master") {
      // master → generic login
      window.location.assign(`/login`);
    } else {
      // everyone else (client, user, admin, manager, etc.)
      window.location.assign(`/user-login`);
    }
  };

  // 🆕 helper: if token expired → logout, else return ms left
  const ensureValidToken = useCallback((): number | null => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;
    try {
      const { exp } = jwtDecode<Decoded>(token);
      const msLeft = exp * 1000 - Date.now();
      if (msLeft <= 0) {
        handleLogout();
        return null;
      }
      return msLeft;
    } catch {
      handleLogout();
      return null;
    }
  }, [handleLogout]);

  // 🆕 central logout function (moved up so effects can use it)
  const logoutTimerRef = useRef<number | null>(null); // 🆕

  useEffect(() => {
    if (isAuthRoute) return;
    const msLeft = ensureValidToken();
    if (msLeft && msLeft > 0) {
      if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = window.setTimeout(() => {
        handleLogout();
      }, msLeft) as unknown as number;
    }
    return () => {
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [pathname, isAuthRoute, ensureValidToken, handleLogout]);

  // 🆕 Effect 3: Global Axios interceptors (attach token + auto-logout on 401)
  useEffect(() => {
    if (isAuthRoute) return;

    const reqId = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const resId = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          // token expired/invalid
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [isAuthRoute, handleLogout]);

  // ⛔️ On auth routes, render ONLY the auth page (no sidebar/header/guard)
  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }

  const handleSettingsClick = () => {
    if (currentUser?.role === "master") {
      router.push("/admin/settings");
    } else {
      router.push("/profile");
    }
  };

  const role = localStorage.getItem("role");
  // console.log("User role:", role);

  const roleLower = (currentUser?.role ?? "").toLowerCase();
  // console.log("current User :", currentUser);
  const showAppSidebar = ["master", "client", "customer", "admin"].includes(
    roleLower
  );

  // 🆕 Effect 1: Initial guard on protected pages + set date/user
  // useEffect(() => {
  //   if (isAuthRoute) {
  //     setIsLoading(false);
  //     return;
  //   }

  //   const today = new Date();
  //   setDateString(
  //     today.toLocaleDateString("en-US", {
  //       weekday: "long",
  //       year: "numeric",
  //       month: "long",
  //       day: "numeric",
  //     })
  //   );

  //   // Check token validity immediately
  //   const msLeft = ensureValidToken();
  //   if (msLeft === null) {
  //     // token missing/expired → ensureValidToken already redirected
  //     setIsLoading(false);
  //     return;
  //   }

  //   const user = getCurrentUser();
  //   if (!user) {
  //     router.replace("/login");
  //     setIsLoading(false);
  //     return;
  //   }

  //   setCurrentUser(user);
  //   setIsLoading(false);
  // }, [router, pathname, isAuthRoute, ensureValidToken]);

  // 🆕 Effect 2: Schedule auto-logout exactly when token expires

  return (
    <CompanyProvider>
      <PermissionProvider>
        <UserPermissionsProvider>
          <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground ">
              {showAppSidebar ? <AppSidebar /> : <UserSidebar />}
              <div className="flex-1 flex flex-col w-full">
                <header className="flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-card px-4 md:px-6 sticky top-0 z-20">
                  <div className="flex items-center gap-2 md:gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <div className="hidden md:block">
                      <h1 className="text-lg font-semibold">
                        Welcome back,{" "}
                        {currentUser?.role === "master"
                          ? "Master!"
                          : currentUser?.name?.split(" ")[0]}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {dateString}
                      </p>
                    </div>
                    {(currentUser?.role === "customer" ||
                      currentUser?.role === "user" ||
                      currentUser?.role === "admin" ||
                      currentUser?.role === "manager") && (
                      <div className="hidden md:block">
                        <CompanySwitcher />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
                    <div className="relative w-full max-w-md hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        className="pl-9 bg-background"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Search className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                    {role !== "user" && role !== "master" && <Notification />}

                    {role === "master" && (
                      <div
                        onClick={handleHistoryClick}
                        className="cursor-pointer"
                      >
                        <HistoryIcon className="h-6 w-6" /> {/* History Icon */}
                      </div>
                    )}

                   
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-1 md:p-2 h-auto"
                        >
                          <UserNav />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push("/profile")}
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSettingsClick}>
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 w-[42vh] sm:min-w-[165vh]">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </UserPermissionsProvider>
      </PermissionProvider>
    </CompanyProvider>
  );
}
