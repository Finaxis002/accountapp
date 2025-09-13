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

  // Fetch the list of clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseURL}/api/clients`);
        setClients(response.data);
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
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    fetchNotifications(client._id);
  };

  const getNotificationColor = (type: string | undefined) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "error":
        return "border-l-red-500 bg-red-50";
      case "sales":
        return "border-l-purple-500 bg-purple-50";
      case "create":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
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
                  <div className="flex items-center mt-4 text-slate-700">
                    <User className="h-4 w-4 mr-2" />
                    <span>{selectedClient.contactName}</span>
                  </div>
                  <div className="flex items-center mt-2 text-slate-700">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{selectedClient.phone}</span>
                  </div>
                </SheetHeader>

                <div className="py-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-blue-500" />
                    Notification History
                  </h3>

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
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">
                        No notifications available for this client.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 rounded-lg border-l-4 ${getNotificationColor(
                            notification.type
                          )} shadow-sm border border-slate-200`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-slate-800">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 mt-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-3 text-slate-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {formatDate(notification.createdAt)} •{" "}
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          {notification.triggeredBy && (
                            <div className="mt-2 text-xs text-slate-500">
                              By:{" "}
                              {notification.triggeredBy.userName ||
                                notification.triggeredBy.email}
                            </div>
                          )}
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
