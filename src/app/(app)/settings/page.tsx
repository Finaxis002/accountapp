
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Bell, Save, Building, Users, Package, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorSettings } from '@/components/settings/vendor-settings';
import { CustomerSettings } from '@/components/settings/customer-settings';
import { ProductSettings } from '@/components/settings/product-settings';
import { usePermissions } from '@/contexts/permission-context';
import { cn } from '@/lib/utils';


export default function SettingsPage() {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const availableTabs = [
    { value: 'profile', label: 'Profile', component: <ProfileTab /> },
    permissions?.canCreateVendors && { value: 'vendors', label: 'Vendors', component: <VendorSettings /> },
    permissions?.canCreateCustomers && { value: 'customers', label: 'Customers', component: <CustomerSettings /> },
    permissions?.canCreateProducts && { value: 'products', label: 'Products', component: <ProductSettings /> },
    { value: 'notifications', label: 'Notifications', component: <NotificationsTab /> },
  ].filter(Boolean) as { value: string, label: string, component: React.ReactNode }[];

  const gridColsClass = `grid-cols-${availableTabs.length}`;


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, preferences, and business entities.
        </p>
      </div>

       <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn("grid w-full", gridColsClass)}>
              {availableTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
          </TabsList>
          
          {availableTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              {tab.component}
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}


function ProfileTab() {
  return (
    <Card>
        <CardHeader>
        <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <div className="flex flex-col">
            <CardTitle className="text-lg">Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
            </div>
        </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue="TechCorp Client" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="client@techcorp.com" disabled/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6 justify-end">
            <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
            </Button>
        </CardFooter>
    </Card>
  )
}

function NotificationsTab() {
  return (
    <Card>
        <CardHeader>
        <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="invoice-emails" className="font-medium">Invoice Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new invoices and payments.</p>
                </div>
                <Switch id="invoice-emails" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="report-emails" className="font-medium">Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive monthly financial summary reports via email.</p>
                </div>
                <Switch id="report-emails" />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="security-alerts" className="font-medium">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for security-related events.</p>
                </div>
                <Switch id="security-alerts" defaultChecked />
            </div>
        </CardContent>
    </Card>
  )
}
