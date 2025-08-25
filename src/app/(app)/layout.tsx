"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dateString, setDateString] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute =
    pathname === "/login" || pathname.startsWith("/client-login/");

  useEffect(() => {
    if (isAuthRoute) {
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
      router.replace("/login");
      setIsLoading(false);
      return;
    }

    setCurrentUser(user);
    setIsLoading(false);
  }, [router, pathname, isAuthRoute]);

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

  const handleLogout = () => {
    const role = localStorage.getItem("role");
    const slug =
      localStorage.getItem("tenantSlug") ||
      localStorage.getItem("slug") ||
      localStorage.getItem("clientUsername");

    localStorage.clear();

    if (role === "customer" && slug) {
      window.location.assign(`/client-login/${slug}`);
    } else {
      window.location.assign(`/login`);
    }
  };

  return (
    <CompanyProvider>
      <PermissionProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <AppSidebar />

            {/* Page Content */}
            <div className="flex-1 flex flex-col w-full">
              {/* ===== Header ===== */}
              <header className="fixed top-0 left-0 right-0 z-20 h-16 border-b border-border/40 bg-card">
                <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between px-3 sm:px-4 md:px-6">
                  {/* Left Section */}
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* Mobile Sidebar Trigger */}
                    <SidebarTrigger className="md:hidden" />

                    {/* Welcome text only on md+ */}
                    <div className="hidden sm:block">
                      <h1 className="text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                        Welcome back,{" "}
                        {currentUser?.role === "master"
                          ? "Master!"
                          : currentUser?.name?.split(" ")[0]}
                      </h1>
                      <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground truncate">
                        {dateString}
                      </p>
                    </div>

                    {/* Company Switcher (md+) */}
                    {(currentUser?.role === "customer" ||
                      currentUser?.role === "user" ||
                      currentUser?.role === "admin" ||
                      currentUser?.role === "master") && (
                      <div className="hidden md:block">
                        <CompanySwitcher />
                      </div>
                    )}
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
                    {/* Search Desktop */}
                    <div className="relative hidden md:block w-[160px] lg:w-[240px] xl:w-[320px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        className="pl-9 bg-background text-sm"
                      />
                    </div>

                    {/* Search Mobile */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Search className="h-5 w-5" />
                    </Button>

                    <ThemeToggle />

                    {/* Notifications */}
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
                      <SheetContent
                        side="right"
                        className="w-[90vw] sm:w-[400px]"
                      >
                        <SheetHeader>
                          <SheetTitle>Notifications</SheetTitle>
                          <SheetDescription>
                            You have 3 unread messages.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                          {/* Example notifications */}
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
                      </SheetContent>
                    </Sheet>

                    {/* User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-1 sm:p-2 h-auto"
                        >
                          <UserNav />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] sm:w-[200px]"
                      >
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
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
                </div>
              </header>

              {/* ===== Main Content ===== */}
              <main className="flex-1 w-full pt-16 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </PermissionProvider>
    </CompanyProvider>
  );
}
