import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Bell, Save } from "lucide-react";
import { ClientsValidityManager } from "@/components/admin/settings/ClientsValidityManager";

export default function SettingsPage() {
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Page Heading */}
      <div className="text-center sm:text-left">
       <h2 className="mt-16 text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>

        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account and system preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-center sm:text-left">
            <UserCircle className="h-8 w-8 mx-auto sm:mx-0" />
            <div className="mt-2 sm:mt-0">
              <CardTitle className="text-lg">Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Master Administrator" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="admin@accountech.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="utc-5">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                  <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                  <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                  <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center sm:justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </CardFooter>
      </Card>

      {/* Client Validity Manager */}
      <ClientsValidityManager />

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-center sm:text-left">
            <Bell className="h-8 w-8 mx-auto sm:mx-0" />
            <div className="mt-2 sm:mt-0">
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <Label htmlFor="invoice-emails" className="font-medium">Invoice Emails</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for new invoices and payments.</p>
            </div>
            <Switch id="invoice-emails" defaultChecked />
          </div>
          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <Label htmlFor="report-emails" className="font-medium">Monthly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive monthly financial summary reports via email.</p>
            </div>
            <Switch id="report-emails" />
          </div>
          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <Label htmlFor="security-alerts" className="font-medium">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for security-related events.</p>
            </div>
            <Switch id="security-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
