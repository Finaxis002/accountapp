"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2,
  Bell,
  Calendar,
  Building,
  Mail,
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Client Type based on your API response
interface Client {
  _id: string;
  clientUsername: string;
  contactName: string;
  phone: string;
  email: string;
  maxCompanies: number;
  userLimit: number;
  createdAt: string;
  updatedAt: string;
  businessName?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  action: string;
  entityId: string;
  entityType: string;
  recipient: any;
  triggeredBy: any;
  client: {
    _id: string;
    businessName?: string;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const HistoryPage = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  const [copied, setCopied] = useState(false);
  const name = selectedClient?.contactName || "—";
  const phone = selectedClient?.phone || "—";

  const handleCopy = async () => {
    if (!selectedClient?.phone) return;
    try {
      await navigator.clipboard.writeText(selectedClient.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // Fetch the list of clients
  // Fetch the list of clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token); 
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const res = await fetch(`${baseURL}/api/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients", error);
        setError("Failed to load clients. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [baseURL]);
  const token = localStorage.getItem("token");
  // Fetch notifications for a specific client
  const fetchNotifications = async (clientId: string) => {
    setNotificationsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${baseURL}/api/notifications/master/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Transform the API response to match our Notification interface
      const apiNotifications = response.data.notifications.map(
        (notif: any) => ({
          _id: notif._id,
          title: notif.title || `${notif.action} - ${notif.entityType}`,
          message: notif.message,
          type: notif.type,
          action: notif.action,
          entityId: notif.entityId,
          entityType: notif.entityType,
          recipient: notif.recipient,
          triggeredBy: notif.triggeredBy,
          client: notif.client,
          read: notif.read,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
        })
      );

      setNotifications(apiNotifications);
    } catch (error) {
      console.error("Error fetching notifications", error);
      setError("No Notifications found for this client");
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!selectedClient) return;

    try {
      // Update local state first for immediate UI feedback
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Make API call to mark all as read
      await axios.patch(
        `${baseURL}/api/notifications/master/${selectedClient._id}/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error marking notifications as read", error);
      // Revert UI changes if API call fails
      fetchNotifications(selectedClient._id);
    }
  };

 const handleClientClick = (client: Client) => {
  setSelectedClient(client);
  setError(null);
  setNotifications([]);        // ⬅️ wipe old client’s list right away
  setNotificationsLoading(true);
  fetchNotifications(client._id);
};

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper functions for the new notification UI
  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";

    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-600`} />;
      case "error":
        return <XCircle className={`${iconClass} text-red-600`} />;
      case "info":
      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100";
      case "warning":
        return "bg-amber-100";
      case "error":
        return "bg-red-100";
      case "info":
      default:
        return "bg-blue-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Client History
            </h1>
            <p className="text-slate-600 mt-2">
              View client details and notification history
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-white py-2 px-4 rounded-lg shadow-sm">
            <Bell className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">
              {clients.length} Clients
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-10 w-10 text-blue-500 mx-auto" />
              <p className="text-slate-600 mt-4">Loading clients...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                onClick={() => handleClientClick(client)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold">
                          {getInitials(
                            client.contactName || client.clientUsername
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-slate-800 truncate">
                        {client.businessName || client.clientUsername}
                      </h2>
                      <div className="flex items-center mt-1 text-slate-600 text-sm">
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center mt-2 text-slate-600 text-sm">
                        <User className="h-4 w-4 mr-1" />
                        <span className="truncate">{client.contactName}</span>
                      </div>
                      <div className="flex items-center mt-2 text-slate-500 text-sm">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center mt-2 text-slate-500 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Joined: {formatDate(client.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600 flex items-center">
                    <Bell className="h-4 w-4 mr-1" />
                    <span>Click to view notifications</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Sheet
          open={!!selectedClient}
          onOpenChange={() => setSelectedClient(null)}
        >
          <SheetContent className="w-full sm:max-w-lg lg:max-w-xl overflow-y-auto">
            {selectedClient && (
              <>
                <SheetHeader className="pb-6 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-xl">
                        {getInitials(
                          selectedClient.contactName ||
                            selectedClient.clientUsername
                        )}
                      </span>
                    </div>
                    <div>
                      <SheetTitle className="text-2xl text-slate-800">
                        {selectedClient.businessName ||
                          selectedClient.clientUsername}
                      </SheetTitle>
                      <SheetDescription className="flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedClient.email}
                      </SheetDescription>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    {/* Contact name */}
                    <div className="flex min-w-0 items-center">
                      <User
                        className="mr-2 h-4 w-4 text-slate-500"
                        aria-hidden="true"
                      />
                      <span
                        className="truncate text-sm font-medium"
                        title={name}
                      >
                        {name}
                      </span>
                    </div>

                    {/* Divider */}
                    <span
                      className="hidden h-4 w-px bg-slate-400 md:inline-block"
                      aria-hidden="true"
                    />

                    {/* Phone with tel link + copy */}
                    <div className="flex items-center gap-2">
                      <Phone
                        className="h-4 w-4 text-slate-500"
                        aria-hidden="true"
                      />
                      {selectedClient?.phone ? (
                        <a
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                          className="text-sm underline-offset-2 hover:underline"
                        >
                          {phone}
                        </a>
                      ) : (
                        <span className="text-sm">{phone}</span>
                      )}

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition"
                        title={copied ? "Copied!" : "Copy phone"}
                        aria-label={
                          copied ? "Phone copied" : "Copy phone number"
                        }
                        disabled={!selectedClient?.phone}
                      >
                        {copied ? (
                          <Check className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <Copy className="mr-1 h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </SheetHeader>

                <div className="py-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-blue-500" />
                      Notification History
                    </h3>
                    {notifications.length > 0 && (
                      <button
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        onClick={markAllAsRead}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
                        <p className="text-slate-600 mt-4">
                          Loading notifications...
                        </p>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-200 mb-4">
                        <Bell className="h-8 w-8 text-slate-400" />
                      </div>
                      <h4 className="font-medium text-slate-700 mb-1">
                        No notifications yet
                      </h4>
                      <p className="text-slate-500 text-sm">
                        Notifications for this client will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`relative p-4 rounded-xl shadow-sm transition-all hover:shadow-md ${
                            notification.read ? "bg-white" : "bg-blue-50"
                          } border border-slate-200`}
                        >
                          {/* {!notification.read && (
                            <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                          )} */}

                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 h-10 w-10 text-sm rounded-lg flex items-center justify-center ${getNotificationIconBg(
                                notification.type
                              )}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <h4 className="font-semibold text-slate-800">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-700 mt-1 text-sm">
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center text-xs text-slate-500">
                                <span>
                                  {formatDate(notification.createdAt)}
                                </span>
                                {notification.triggeredBy && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>
                                      By:{" "}
                                      {notification.triggeredBy.userName ||
                                        notification.triggeredBy.email}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default HistoryPage;
