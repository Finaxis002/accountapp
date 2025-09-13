
'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, Bell, Calendar, Building, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Client Type
interface Client {
  _id: string;
  businessName: string;
  email: string;
  industry?: string;
  lastContact?: string;
  avatar?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
}

const HistoryPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch the list of clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        // Mock data for demonstration - replace with your actual API call
        const mockClients: Client[] = [
          {
            _id: "1",
            businessName: "Acme Corporation",
            email: "contact@acme.com",
            industry: "Manufacturing",
            lastContact: "2023-10-15",
            avatar: "AC"
          },
          {
            _id: "2",
            businessName: "Globex Inc.",
            email: "info@globex.com",
            industry: "Technology",
            lastContact: "2023-10-12",
            avatar: "GI"
          },
          {
            _id: "3",
            businessName: "Wayne Enterprises",
            email: "office@wayne.com",
            industry: "Defense",
            lastContact: "2023-10-10",
            avatar: "WE"
          },
          {
            _id: "4",
            businessName: "Stark Industries",
            email: "tony@stark.com",
            industry: "Energy",
            lastContact: "2023-10-08",
            avatar: "SI"
          },
          {
            _id: "5",
            businessName: "Oscorp",
            email: "norman@oscorp.com",
            industry: "Biotech",
            lastContact: "2023-10-05",
            avatar: "OS"
          },
          {
            _id: "6",
            businessName: "Umbrella Corp",
            email: "info@umbrella.com",
            industry: "Pharmaceuticals",
            lastContact: "2023-10-01",
            avatar: "UC"
          }
        ];
        
        setClients(mockClients);
        // In your actual implementation, use:
        // const response = await axios.get("/api/clients");
        // setClients(response.data);
      } catch (error) {
        console.error("Error fetching clients", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Fetch notifications for a specific client
  const fetchNotifications = async (clientId: string) => {
    setNotificationsLoading(true);
    try {
      // Mock data for demonstration - replace with your actual API call
      const mockNotifications: Notification[] = [
        {
          _id: "1",
          title: "Payment Received",
          message: "Invoice #INV-2023-1052 has been paid successfully.",
          createdAt: "2023-10-15T14:30:00Z",
          read: true,
          type: "success"
        },
        {
          _id: "2",
          title: "Project Update",
          message: "Phase 2 of the website redesign has been completed ahead of schedule.",
          createdAt: "2023-10-12T10:15:00Z",
          read: true,
          type: "info"
        },
        {
          _id: "3",
          title: "Meeting Reminder",
          message: "Quarterly review meeting scheduled for tomorrow at 2:00 PM.",
          createdAt: "2023-10-10T16:45:00Z",
          read: false,
          type: "warning"
        },
        {
          _id: "4",
          title: "Contract Renewal",
          message: "Your service contract is up for renewal in 15 days.",
          createdAt: "2023-10-08T09:20:00Z",
          read: false,
          type: "warning"
        },
        {
          _id: "5",
          title: "New Message",
          message: "You have received a new message from the client regarding project specifications.",
          createdAt: "2023-10-05T11:30:00Z",
          read: true,
          type: "info"
        }
      ];
      
      setNotifications(mockNotifications);
      // In your actual implementation, use:
      // const response = await axios.get(`/api/notifications/client/${clientId}`);
      // setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    fetchNotifications(client._id);
  };

  const getNotificationColor = (type: string | undefined) => {
    switch(type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      case 'info': 
      default: return 'border-l-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Client History</h1>
            <p className="text-slate-600 mt-2">View client details and notification history</p>
          </div>
          <div className="flex items-center space-x-2 bg-white py-2 px-4 rounded-lg shadow-sm">
            <Bell className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">{clients.length} Clients</span>
          </div>
        </div>
      
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
                        <span className="text-blue-700 font-bold">{client.avatar}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-slate-800 truncate">{client.businessName}</h2>
                      <div className="flex items-center mt-1 text-slate-600 text-sm">
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.industry && (
                        <div className="flex items-center mt-2 text-slate-600 text-sm">
                          <Building className="h-4 w-4 mr-1" />
                          <span>{client.industry}</span>
                        </div>
                      )}
                      {client.lastContact && (
                        <div className="flex items-center mt-2 text-slate-500 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Last contact: {formatDate(client.lastContact)}</span>
                        </div>
                      )}
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

        <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <SheetContent className="w-full sm:max-w-lg lg:max-w-xl overflow-y-auto">
            {selectedClient && (
              <>
                <SheetHeader className="pb-6 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-xl">{selectedClient.avatar}</span>
                    </div>
                    <div>
                      <SheetTitle className="text-2xl text-slate-800">{selectedClient.businessName}</SheetTitle>
                      <SheetDescription className="flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedClient.email}
                      </SheetDescription>
                    </div>
                  </div>
                  {selectedClient.industry && (
                    <div className="flex items-center mt-4 text-slate-700">
                      <Building className="h-4 w-4 mr-2" />
                      <span>{selectedClient.industry}</span>
                    </div>
                  )}
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
                        <p className="text-slate-600 mt-4">Loading notifications...</p>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No notifications available for this client.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`p-4 bg-white rounded-lg border-l-4 ${getNotificationColor(notification.type)} shadow-sm border border-slate-200`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 mt-2">{notification.message}</p>
                          <div className="flex items-center mt-3 text-slate-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDate(notification.createdAt)} • {formatTime(notification.createdAt)}</span>
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