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
import { SupportProvider } from "@/contexts/support-context";
import { FloatingSupportIcon } from "@/components/support/FloatingSupportIcon";

type Decoded = { exp: number; id: string; role: string }; // 🆕

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dateString, setDateString] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(""); // Store search term
  const [highlightCount, setHighlightCount] = useState(0); // Tracks the number of highlighted words
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0); // Tracks current highlight index
  // ✅ treat these as public routes: do NOT wrap, do NOT redirect
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Access localStorage only on the client-side
      const storedRole = localStorage.getItem("role");
      setRole(storedRole); // Set the role in state
    }

    // Fetch current user from some method (e.g., `getCurrentUser()`)
    const user = getCurrentUser(); // Assuming `getCurrentUser()` is a function that retrieves the logged-in user
    if (user) {
      setCurrentUser(user); // Set the current user in state
    }

    setIsLoading(false); // Once the data is fetched, set isLoading to false
  }, []);

  const userRole = currentUser?.role || role;

  // Define which roles should see the support icon
  const showSupportIcon = userRole === "customer" || userRole === "admin";
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/user-login" ||
    pathname.startsWith("/client-login/") ||
    pathname.startsWith("/user-login/");
  // Re-run on searchTerm/route change (SSR guard bhi)
  useEffect(() => {
    console.log("Current User:", currentUser); // Check user role
    console.log("Search Term:", searchTerm); // Track search term changes
  }, [currentUser, searchTerm]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = contentRef.current;
    if (!root) return;

    clearHighlights(root);

    const term = searchTerm.trim();
    if (!term) {
      setHighlightCount(0); // 🔑 reset
      setCurrentHighlightIndex(0); // 🔑 reset
      return;
    }

    applyHighlights(root, term);
  }, [searchTerm, currentHighlightIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" &&
        currentHighlightIndex < highlightCount - 1
      ) {
        setCurrentHighlightIndex(currentHighlightIndex + 1);
        scrollToHighlight(currentHighlightIndex + 1);
      }

      if (event.key === "ArrowUp" && currentHighlightIndex > 0) {
        setCurrentHighlightIndex(currentHighlightIndex - 1);
        scrollToHighlight(currentHighlightIndex - 1);
      }

      if (event.key === "Enter") {
        console.log(
          "Enter key pressed on the highlighted word",
          currentHighlightIndex
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentHighlightIndex, highlightCount]);
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

  // const role = localStorage.getItem("role");
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  // Escape regex special chars
  const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // const clearHighlights = (root: HTMLElement) => {
  //   const marks = root.querySelectorAll("mark.__hl");
  //   marks.forEach((m) => {
  //     const parent = m.parentNode;
  //     if (parent) {
  //       parent.replaceChild(document.createTextNode(m.textContent || ""), m);
  //     }
  //   });
  // };

  const clearHighlights = (root: HTMLElement) => {
    const marks = root.querySelectorAll("mark.__hl");
    marks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ""), m);
        parent.normalize();
      }
    });
  };

  const applyHighlights = (root: HTMLElement, term: string) => {
    if (!term) return;
    const safeTerm = escapeReg(term);
    const rx = new RegExp(safeTerm, "gi");

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const skipTags = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "MARK",
      "INPUT",
      "TEXTAREA",
    ]);

    let nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const el = textNode.parentElement;
      if (!el || skipTags.has(el.tagName)) continue;
      if (textNode.nodeValue?.trim()) nodes.push(textNode);
    }

    let count = 0;
    nodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      const matches = [...text.matchAll(rx)];
      if (matches.length === 0) return;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach((m) => {
        const start = m.index!;
        const end = start + m[0].length;

        if (start > lastIndex) {
          frag.appendChild(
            document.createTextNode(text.slice(lastIndex, start))
          );
        }

        const mark = document.createElement("mark");
        mark.className = "__hl";

        if (count === currentHighlightIndex) {
          mark.style.backgroundColor = "orange";
        } else {
          mark.style.backgroundColor = "yellow";
        }

        mark.textContent = m[0];
        frag.appendChild(mark);

        lastIndex = end;
        count++;
      });

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.replaceWith(frag);
    });

    setHighlightCount(count);
  };

  const handleNextHighlight = () => {
    if (currentHighlightIndex < highlightCount - 1) {
      setCurrentHighlightIndex((prev) => prev + 1);
      scrollToHighlight(currentHighlightIndex + 1);
    }
  };

  const handlePreviousHighlight = () => {
    if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex((prev) => prev - 1);
      scrollToHighlight(currentHighlightIndex - 1);
    }
  };

  const scrollToHighlight = (index: number) => {
    const marks = contentRef.current?.querySelectorAll("mark.__hl");
    if (marks && marks[index]) {
      marks[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  return (
    <CompanyProvider>
      <PermissionProvider>
        <UserPermissionsProvider>
          <SupportProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full bg-background text-foreground overflow-x-hidden">
                {showAppSidebar ? <AppSidebar /> : <UserSidebar />}
                <div className="flex-1 flex flex-col w-full">
                  <header className="flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-card px-4 md:px-6 sticky top-0 md:static z-20">
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
                        <div>
                          <CompanySwitcher />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
                      <div className="relative w-full max-w-md hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          className="pl-9 bg-background pr-10"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />

                        {/* Clear button add*/}
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:underline"
                          >
                            &#x2716;
                          </button>
                        )}

                        {/* Highlight count */}
                        {highlightCount > 0 && (
                          <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {highlightCount > 0 ? currentHighlightIndex + 1 : 0}
                            /{highlightCount}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:block"
                      >
                        <Search className="h-5 w-5" />
                      </Button>

                      <ThemeToggle />
                      {role !== "user" && role !== "master" && <Notification />}

                      {role === "master" && (
                        <div
                          onClick={handleHistoryClick}
                          className="cursor-pointer"
                        >
                          <HistoryIcon className="h-6 w-6" />{" "}
                          {/* History Icon */}
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

                          {role === "master" && (
                            <DropdownMenuItem
                              onClick={() => router.push("/profile")}
                            >
                              Profile
                            </DropdownMenuItem>
                          )}

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
                  <main
                    ref={contentRef}
                    className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden"
                  >
                    {children}
                  </main>
                </div>
                {showSupportIcon &&  pathname === "/profile" && <FloatingSupportIcon />}
              </div>
            </SidebarProvider>
          </SupportProvider>
        </UserPermissionsProvider>
      </PermissionProvider>
    </CompanyProvider>
  );
}
