"use client";

import { useState, useEffect } from "react";
import { Bell, X, Play, CheckCircle, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  name: string;
  sectionUrl: string;
  gifUrl: string;
  description: string;
}

interface UpdateNotification {
  _id: string;
  title: string;
  description: string;
  version: string;
  features: Feature[];
  exploredSections: string[];
  dismissed: boolean;
  propagatedToClients: boolean;
  createdAt: string;
}

const UpdateNotification = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<UpdateNotification | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPropagating, setIsPropagating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Helper function to get user ID from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload._id || payload.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    const userId = getUserIdFromToken();
    if (!userId) return;

    const newSocket = io(baseURL || "http://localhost:8745");
    setSocket(newSocket);

    // Join appropriate room based on user role
    if (user.role === "master") {
      newSocket.emit('joinRoom', {
        userId: userId,
        role: 'master'
      });

      // Listen for new update notifications
      newSocket.on('newUpdateNotification', (data) => {
        fetchNotifications();
        toast({
          title: "New Update Available",
          description: data.message,
        });
      });

      // Listen for dismissed notifications
      newSocket.on('updateNotificationDismissed', (data) => {
        setNotifications(prev =>
          prev.filter(n => n._id !== data.notificationId)
        );
      });
    } else {
      // For clients/users, join user room
      newSocket.emit('joinRoom', {
        userId: userId,
        role: user.role || 'user'
      });

      // Listen for new notifications
      newSocket.on('newNotification', (data) => {
        fetchNotifications();
        toast({
          title: "New Update Available",
          description: data.message,
        });
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) return;

      const user = JSON.parse(userData);
      const userId = getUserIdFromToken();
      if (!userId) {
        console.error("User ID not found in token");
        return;
      }

      let notificationsData: UpdateNotification[] = [];

      if (user.role === "master") {
        // For master admins, fetch update notifications
        const response = await axios.get(`${baseURL}/api/update-notifications/master/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        notificationsData = response.data.notifications || [];
        console.log("Fetched master notifications:", notificationsData);
      } else {
        // For clients/users, fetch regular notifications with update type
        try {
          const response = await axios.get(`${baseURL}/api/notifications/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const allNotifications = response.data.notifications || response.data || [];
          console.log("Fetched client notifications:", allNotifications);

          // Filter for update notifications that have been propagated
          const updateNotifications = allNotifications.filter((n: any) =>
            n.type === 'system' && n.action === 'update' && n.entityType === 'UpdateNotification'
          );

          // Convert regular notifications to UpdateNotification format
          notificationsData = updateNotifications.map((n: any) => ({
            _id: n.entityId, // Use the original update notification ID
            title: n.title,
            description: n.message,
            version: n.metadata?.updateVersion || 'Unknown',
            features: [], // Regular notifications don't have features
            exploredSections: [], // Clients can't explore sections
            dismissed: n.read, // Use read status as dismissed
            propagatedToClients: true, // These are already propagated
            createdAt: n.createdAt
          }));

          console.log("Converted update notifications:", notificationsData);
        } catch (clientError) {
          console.error("Error fetching client notifications:", clientError);
        }
      }

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching update notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = async (notification: UpdateNotification, feature: Feature, showDemo: boolean = true) => {
    // Only allow exploration for master admins
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    if (user.role !== "master") return;

    // Mark section as explored
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${baseURL}/api/update-notifications/explore-section`, {
        notificationId: notification._id,
        sectionUrl: feature.sectionUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id
            ? { ...n, exploredSections: [...n.exploredSections, feature.sectionUrl] }
            : n
        )
      );

      // Navigate to the section
      router.push(feature.sectionUrl);

      // Show GIF in modal only if requested
      if (showDemo) {
        setSelectedFeature(feature);
      }
    } catch (error) {
      console.error("Error marking section as explored:", error);
    }
  };

  const handleViewDemoClick = async (notification: UpdateNotification, feature: Feature, event: React.MouseEvent) => {
    // Prevent the parent div's onClick from firing
    event.stopPropagation();

    // Navigate to feature without showing modal
    await handleFeatureClick(notification, feature, false);
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!userData) return;

      const user = JSON.parse(userData);

      if (user.role === "master") {
        // For master admins, dismiss the update notification
        await axios.patch(`${baseURL}/api/update-notifications/dismiss/${notificationId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // For clients, mark the regular notification as read
        // We need to find the actual notification ID from the regular notifications
        const userId = getUserIdFromToken();
        if (userId) {
          const response = await axios.get(`${baseURL}/api/notifications/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const allNotifications = response.data.notifications || response.data || [];
          const targetNotification = allNotifications.find((n: any) =>
            n.entityId === notificationId && n.type === 'system' && n.action === 'update'
          );

          if (targetNotification) {
            await axios.patch(`${baseURL}/api/notifications/mark-as-read/${targetNotification._id}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handlePropagateToClients = async (notificationId: string) => {
    try {
      setIsPropagating(true);
      const token = localStorage.getItem("token");
      await axios.post(`${baseURL}/api/update-notifications/propagate/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId
            ? { ...n, propagatedToClients: true }
            : n
        )
      );

      toast({
        title: "Success",
        description: "Update notification propagated to all clients",
      });
    } catch (error) {
      console.error("Error propagating to clients:", error);
      toast({
        title: "Error",
        description: "Failed to propagate to clients",
        variant: "destructive",
      });
    } finally {
      setIsPropagating(false);
    }
  };

  const getExploredCount = (notification: UpdateNotification) => {
    return notification.exploredSections.length;
  };

  const getTotalFeatures = (notification: UpdateNotification) => {
    return notification.features.length;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return null; // No notifications to show
  }

  return (
    <>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const userData = localStorage.getItem("user");
          const user = userData ? JSON.parse(userData) : null;
          const isMaster = user?.role === "master";
          const hasFeatures = notification.features && notification.features.length > 0;

          return (
            <Card key={notification._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Version {notification.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMaster && hasFeatures && (
                      <Badge variant="secondary">
                        {getExploredCount(notification)}/{getTotalFeatures(notification)} explored
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(notification._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{notification.description}</p>

                {isMaster && hasFeatures && (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">New Features:</h4>
                      {notification.features.map((feature, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/50 ${
                            notification.exploredSections.includes(feature.sectionUrl)
                              ? 'bg-green-50 border-green-200'
                              : 'bg-background'
                          }`}
                          onClick={() => handleFeatureClick(notification, feature)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Explore ${feature.name} feature`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleFeatureClick(notification, feature);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {notification.exploredSections.includes(feature.sectionUrl) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Play className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="text-sm font-medium">{feature.name}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={(event) => handleViewDemoClick(notification, feature, event)}
                          >
                            View Demo
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />
                  </>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {isMaster && hasFeatures
                      ? (getExploredCount(notification) === getTotalFeatures(notification)
                          ? "All features explored - notification will auto-dismiss"
                          : "Click on features to view demo or click 'View Demo' to go directly to the feature")
                      : "Update notification from your administrator"
                    }
                  </p>
                  {isMaster && !notification.propagatedToClients && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropagateToClients(notification._id)}
                      disabled={isPropagating}
                    >
                      {isPropagating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Notify Clients
                    </Button>
                  )}
                  {notification.propagatedToClients && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isMaster ? "Clients Notified" : "Update Available"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GIF Demo Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="feature-description">
          <DialogHeader>
            <DialogTitle>{selectedFeature?.name}</DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-4">
              <p id="feature-description" className="text-sm text-muted-foreground">
                {selectedFeature.description}
              </p>
              <div className="flex justify-center">
                <img
                  src={selectedFeature.gifUrl}
                  alt={`${selectedFeature.name} feature demonstration`}
                  className="max-w-full max-h-96 rounded-lg border"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setSelectedFeature(null)} aria-label="Close feature demo">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateNotification;