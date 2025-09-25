"use client";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  BarChart2,
  ChevronDown,
  LogOut,
  ArrowRightLeft,
  FileText,
  FileBarChart2,
  Users,
  Settings,
  Shield,
  Building,
  Users2,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "../ui/sidebar";
import { usePermissions } from "@/contexts/permission-context";
import { useUserPermissions } from "@/contexts/user-permissions-context";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { permissions, isLoading: permissionsLoading } = usePermissions();
const { permissions: userCaps, isLoading } = useUserPermissions();
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);


 const roleLower = (currentUser?.role ?? "").toLowerCase();
  const canSeeUsers =
    roleLower === "admin" || (!!permissions && permissions.canCreateUsers);

  const canSeeInventory = roleLower === "admin" || (!!userCaps && userCaps.canCreateInventory)


  const isActive = (path: string) => {
    // Avoids matching /admin/dashboard when on /dashboard
    if (path === "/dashboard" && pathname.startsWith("/admin")) return false;
    if (path === "/admin/dashboard" && pathname === "/dashboard") return false;

    // Exact match
    if (pathname === path) return true;

    // Partial match for parent routes, but not for the root
    if (path !== "/" && pathname.startsWith(path)) return true;

    return false;
  };

  const isReportsActive = isActive("/reports");

  const isAdmin = currentUser?.role === "master";

  const adminMenu = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/dashboard")}
          tooltip="Dashboard"
        >
          <Link href="/admin/dashboard">
            <LayoutGrid />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/client-management")}
          tooltip="Client Management"
        >
          <Link href="/admin/client-management">
            <Users />
            <span>Client Management</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/companies")}
          tooltip="Companies"
        >
          <Link href="/admin/companies">
            <Building />
            <span>Companies</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/analytics")}
          tooltip="Analytics"
        >
          <Link href="/admin/analytics">
            <BarChart2 />
            <span>Analytics</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {/* <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/permissions")}
          tooltip="Permissions"
        >
          <Link href="/admin/permissions">
            <Shield />
            <span>Permissions</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem> */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/admin/settings")}
          tooltip="Settings"
        >
          <Link href="/admin/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  const customerMenu = (
    <>
      {/* Dashboard */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Dashboard">
          <Link href="/dashboard">
            <LayoutGrid />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Transactions */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/transactions")} tooltip="Transactions">
          <Link href="/transactions">
            <ArrowRightLeft />
            <span>Transactions</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Inventory (keeps existing permission gating) */}
      { canSeeInventory && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive("/inventory")} tooltip="Inventory">
            <Link href="/inventory">
              <Package />
              <span>Inventory</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* Companies — show when permission allows */}
      {permissions && permissions.canCreateCompanies && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive("/companies")} tooltip="Companies">
            <Link href="/companies">
              <Building />
              <span>Companies</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* Users — show for admins OR when permission allows */}
      {canSeeUsers && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive("/users")} tooltip="Users">
            <Link href="/users">
              <Users />
              <span>Users</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* (optional) keep the loading indicator for other caps, but it's no longer gating "Users" for admin */}
      {permissionsLoading && (
        <div className="flex items-center gap-2 p-2">
          <Loader2 className="h-4 w-4 animate-spin" /> <span>Loading...</span>
        </div>
      )}

      <Collapsible defaultOpen={isReportsActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="w-full justify-between"
              isActive={isReportsActive}
              tooltip="Reports"
            >
              <div className="flex items-center gap-2">
                <FileBarChart2 />
                <span>Reports</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                asChild
                isActive={isActive("/reports/profit-loss")}
              >
                <Link href="/reports/profit-loss">Profit & Loss</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                asChild
                isActive={isActive("/reports/balance-sheet")}
              >
                <Link href="/reports/balance-sheet">Balance Sheet</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            AccounTech Pro
          </h1>
        </div>
        {/* <SidebarTrigger className="hidden md:flex" /> */}
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-4 space-y-2">
        {currentUser ? (isAdmin ? adminMenu : customerMenu) : null}
      </SidebarMenu>

      {currentUser && (
        <div className="p-4 space-y-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={currentUser?.avatar}
                alt={`@${currentUser?.name}`}
              />
              <AvatarFallback>{currentUser?.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {currentUser?.role === "master"
                  ? "Master Administrator"
                  : currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </div>
          {/* <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button> */}
        </div>
      )}
    </Sidebar>
  );
}