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
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { ProfileTab } from "@/components/settings/profile-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { ServiceSettings } from "@/components/settings/service-settings";
import { EmailSendingConsent } from "@/components/settings/email-sending-consent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";



export default function ProfilePage() {
  const { permissions, isLoading } = usePermissions();           // client (master) perms
  const { permissions: userCaps, isLoading: isUserLoading } = useUserPermissions(); // user perms

  const currentUser = getCurrentUser();
  const role = currentUser?.role;

  // clients in your app are usually "customer" (sometimes "client")
  const isClient = role === "customer";
  const isUser   = role === "user" || role === "manager" || role === "admin";
  const isMember = isClient || isUser;  // someone whose tabs depend on perms

  // wait until the relevant perms are loaded
  if (isMember && (isLoading || isUserLoading)) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // helper: allow if client has it OR user has it
  const allow = (clientFlag?: boolean | null, userFlag?: boolean | null) =>
    (isClient && !!clientFlag) || (isUser && !!userFlag);

  const adminTabs = [
    { value: "profile", label: "Profile", component: <ProfileTab /> },
    { value: "notifications", label: "Notifications", component: <NotificationsTab /> },
  ];

  const permissionsTab = isUser
  ? { value: "my-permissions", label: "My Permissions", component: <UserPermissionsTab /> }
  : { value: "permissions",     label: "Permissions",    component: <PermissionsTab /> };

  const memberTabs = [
    permissionsTab,

    allow(permissions?.canCreateVendors, userCaps?.canCreateVendors) && {
      value: "vendors",
      label: "Vendors",
      component: <VendorSettings />,
    },
    allow(permissions?.canCreateCustomers, userCaps?.canCreateCustomers) && {
      value: "customers",
      label: "Customers",
      component: <CustomerSettings />,
    },
    // Inventory controls both Products and Services
    allow(userCaps?.canCreateInventory, userCaps?.canCreateInventory) && {
      value: "products",
      label: "Products",
      component: <ProductSettings />,
    },
    allow(userCaps?.canCreateInventory, userCaps?.canCreateInventory) && {
      value: "services",
      label: "Services",
      component: <ServiceSettings />,
    },

    { value: "notifications", label: "Notifications", component: <NotificationsTab /> },
  ].filter(Boolean) as { value: string; label: string; component: React.ReactNode }[];

  const availableTabs = isMember ? memberTabs : adminTabs;
  const defaultTab = isMember ? "permissions" : "profile";

  const gridColsClass = `grid-cols-${availableTabs.length}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-xl">Settings</h2>
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
   const { permissions } = usePermissions();                 // client perms
  const { permissions: userCaps } = useUserPermissions();   // user perms
  const currentUser = getCurrentUser();
  const isCustomer = currentUser?.role === "customer";

  const [gmailOpen, setGmailOpen] = React.useState(false);
  const [gmailLinked, setGmailLinked] = React.useState(false);
  const [gmailEmail, setGmailEmail] = React.useState<string | null>(null);

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
  // load current link state
  // load current link state
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/integrations/gmail/status", {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = await r.json();
        // ✅ use 'connected' from backend, not 'linked'
        setGmailLinked(!!data?.connected);
        setGmailEmail(data?.email ?? null);
      } catch {
        /* ignore */
      }
    })();
  }, []);

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

  const emailPerm = permissions?.canSendInvoiceEmail === true;

  return (
  <div className="w-full mb-2 sm:px-4 lg:px-0.5">
    {isCustomer && (
      <div className="grid md:grid-cols-1 mb-2 gap-6">
        <Card>
          <CardHeader >
            <div className="flex items-center gap-3 text-center lg:text-left">
              <Shield className="h-6 w-6 shrink-0 " />
              <div className="flex flex-col pr-6">
                <CardTitle className="text-base sm:text-lg">
                  Plan & Permissions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your current feature access and limits.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Usage Limits */}
            <div>
             <h4 className="font-medium mb-4 text-sm text-muted-foreground text-center lg:text-left">
                Usage Limits
               </h4>

              <div className="grid grid-cols-3 gap-4 text-center">
  {limitItems.map((item) => (
    <div
      key={item.label}
      className="p-3 bg-secondary/50 rounded-lg"
    >
      {/* Row on mobile/tablet, stacked on laptop/desktop */}
      <div className="flex lg:block items-center justify-center gap-2">
        <item.icon className="h-6 w-6 text-muted-foreground lg:mx-auto lg:mb-2" />
        <p className="text-xl font-bold">
          {item.value ?? "N/A"}
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-1 ">
        {item.label}
      </p>
    </div>
  ))}
</div>

            </div>

            <Separator />

            {/* Feature Access */}
            <div>
              <h4 className="font-medium mb-4 text-sm text-muted-foreground">
                Feature Access
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionItems.map((item) => {
                  const isEmailRow = item.label === "Send Invoice via Email";
                  const statusIcon = !emailPerm ? (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  ) : gmailLinked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  );

                  return (
                    <div
                      key={item.label}
                      className="flex flex-wrap items-center justify-between text-sm p-3 rounded-lg border gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">
                          {item.label}
                        </span>

                        {isEmailRow && (
                          <Tooltip delayDuration={150}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  emailPerm && setGmailOpen(true)
                                }
                                className="ml-1 inline-flex items-center"
                                aria-label="Email sending status"
                              >
                                {statusIcon}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-[260px]"
                            >
                              {!emailPerm ? (
                                <span>
                                  Permission not granted by Master admin. You
                                  can’t email invoices yet.
                                </span>
                              ) : gmailLinked ? (
                                <span>
                                  Linked to <b>{gmailEmail}</b>. Click to manage
                                  Gmail link.
                                </span>
                              ) : (
                                <span>
                                  Master admin granted this permission. Click to
                                  connect Gmail so invoices can be emailed to
                                  your customers.
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Status badge */}
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
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {isCustomer && permissions?.canSendInvoiceEmail && <EmailSendingConsent />}
  </div>
);

}



function UserPermissionsTab() {
  const { permissions: userCaps } = useUserPermissions();

  // convenience: treat only literal `true` as granted
  const yes = (v: unknown) => v === true;

  const features = [
    { label: "Create Sales Entries",     granted: yes(userCaps?.canCreateSaleEntries),     icon: Users },
    { label: "Create Purchase Entries",  granted: yes(userCaps?.canCreatePurchaseEntries), icon: Store },
    { label: "Create Receipt Entries",   granted: yes(userCaps?.canCreateReceiptEntries),  icon: Contact },
    { label: "Create Payment Entries",   granted: yes(userCaps?.canCreatePaymentEntries),  icon: Send },
    { label: "Create Journal Entries",   granted: yes(userCaps?.canCreateJournalEntries),  icon: Package },
    { label: "Create Customers",         granted: yes(userCaps?.canCreateCustomers),       icon: Contact },
    { label: "Create Vendors",           granted: yes(userCaps?.canCreateVendors),         icon: Store },
    { label: "Create Inventory",         granted: yes(userCaps?.canCreateInventory),       icon: Package },
    { label: "Send Invoice via Email",   granted: yes(userCaps?.canSendInvoiceEmail),      icon: Send },
    { label: "Send Invoice via WhatsApp",granted: yes(userCaps?.canSendInvoiceWhatsapp),   icon: MessageSquare },
  ];

  return (
    <div className="grid md:grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div className="flex flex-col">
              <CardTitle className="text-lg">My Permissions</CardTitle>
              <CardDescription>
                What I’m allowed to do in this account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
        
          <Separator />

          {/* Feature Access */}
          <div>
            <h4 className="font-medium mb-4 text-sm text-muted-foreground">
              Feature Access
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-sm p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <f.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{f.label}</span>
                  </div>
                  {f.granted ? (
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
  );
}
