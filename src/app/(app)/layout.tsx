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
} from "lucide-react";
import React, { useState, useEffect } from "react";
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dateString, setDateString] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  console.log("User role:", role);

  const handleLogout = () => {
    // read BEFORE clearing
    const role = localStorage.getItem("role");
    const slug =
      localStorage.getItem("tenantSlug") ||
      localStorage.getItem("slug") ||
      localStorage.getItem("clientUsername");

    // clear everything
    localStorage.clear();
    console.debug("Logout redirect →", role, slug);

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

  const roleLower = (currentUser?.role ?? "").toLowerCase();
  console.log("current User :", currentUser);
  const showAppSidebar = ["master", "client", "customer"].includes(roleLower);

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
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative"
                        >
                          <Bell className="h-5 w-5" />
                          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Notifications</SheetTitle>
                          <SheetDescription>
                            You have 3 unread messages.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  New invoice #INV-2024-003
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Created for Data Systems Ltd.
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-4">
                              <div className="bg-green-500/10 p-2 rounded-full">
                                <DollarSign className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Payment Received
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Rs5,000.00 from Client Innovations LLC.
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-4">
                              <div className="bg-orange-500/10 p-2 rounded-full">
                                <Clock className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Reminder: Invoice Due
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Invoice #INV-2024-002 is due tomorrow.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>

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
