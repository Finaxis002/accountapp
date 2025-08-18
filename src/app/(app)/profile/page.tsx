"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  UserCircle,
  Bell,
  Save,
  Building,
  Users,
  Package,
  Loader2,
  Shield,
  Check,
  X,
  Send,
  MessageSquare,
  Contact,
  Store,
  Server,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorSettings } from "@/components/settings/vendor-settings";
import { CustomerSettings } from "@/components/settings/customer-settings";
import { ProductSettings } from "@/components/settings/product-settings";
import { usePermissions } from "@/contexts/permission-context";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { ProfileTab } from "@/components/settings/profile-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { ServiceSettings } from "@/components/settings/service-settings";
import { EmailSendingConsent } from "@/components/settings/email-sending-consent";

export default function ProfilePage() {
  const { permissions, isLoading } = usePermissions();
  const currentUser = getCurrentUser();
  const isCustomer = currentUser?.role === "customer";

  if (isLoading && isCustomer) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const adminTabs = [
    { value: "profile", label: "Profile", component: <ProfileTab /> },
    {
      value: "notifications",
      label: "Notifications",
      component: <NotificationsTab />,
    },
  ];

  const customerTabs = [
    {
      value: "permissions",
      label: "Permissions",
      component: <PermissionsTab />,
    },
    isCustomer &&
      permissions?.canCreateVendors && {
        value: "vendors",
        label: "Vendors",
        component: <VendorSettings />,
      },
    isCustomer &&
      permissions?.canCreateCustomers && {
        value: "customers",
        label: "Customers",
        component: <CustomerSettings />,
      },
    isCustomer &&
      permissions?.canCreateProducts && {
        value: "products",
        label: "Products",
        component: <ProductSettings />,
      },
    isCustomer &&
      permissions?.canCreateProducts && {
        value: "services",
        label: "Services",
        component: <ServiceSettings />,
      }, // Assuming same permission for now
    {
      value: "notifications",
      label: "Notifications",
      component: <NotificationsTab />,
    },
  ].filter(Boolean) as {
    value: string;
    label: string;
    component: React.ReactNode;
  }[];

  const availableTabs = isCustomer ? customerTabs : adminTabs;
  const defaultTab = isCustomer ? "permissions" : "profile";

  const gridColsClass = `grid-cols-${availableTabs.length}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, preferences, and business entities.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={cn("grid w-full", gridColsClass)}>
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PermissionsTab() {
  const { permissions } = usePermissions();
  const currentUser = getCurrentUser();
  const isCustomer = currentUser?.role === "customer";

  const permissionItems = [
    {
      label: "Create Users",
      granted: permissions?.canCreateUsers,
      icon: Users,
    },
    {
      label: "Create Customers",
      granted: permissions?.canCreateCustomers,
      icon: Contact,
    },
    {
      label: "Create Vendors",
      granted: permissions?.canCreateVendors,
      icon: Store,
    },
    {
      label: "Create Products",
      granted: permissions?.canCreateProducts,
      icon: Package,
    },
    {
      label: "Send Invoice via Email",
      granted: permissions?.canSendInvoiceEmail,
      icon: Send,
    },
    {
      label: "Send Invoice via WhatsApp",
      granted: permissions?.canSendInvoiceWhatsapp,
      icon: MessageSquare,
    },
  ];

  const limitItems = [
    {
      label: "Max Companies",
      value: permissions?.maxCompanies,
      icon: Building,
    },
    { label: "Max Users", value: permissions?.maxUsers, icon: Users },
    {
      label: "Max Inventories",
      value: permissions?.maxInventories,
      icon: Package,
    },
  ];

  return (
    <div>
      {isCustomer && (
        <div className="grid md:grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6" />
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Plan & Permissions</CardTitle>
                  <CardDescription>
                    Your current feature access and limits.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 text-sm text-muted-foreground">
                  Usage Limits
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {limitItems.map((item) => (
                    <div
                      key={item.label}
                      className="p-3 bg-secondary/50 rounded-lg"
                    >
                      <item.icon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xl font-bold">{item.value ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-4 text-sm text-muted-foreground">
                  Feature Access
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {permissionItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-sm p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.granted ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                          <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isCustomer && permissions?.canSendInvoiceEmail && (
        <EmailSendingConsent />
      )}
    </div>
  );
}
