"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

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

const UpdateWalkthrough = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch notifications for clients
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) return;

      const user = JSON.parse(userData);

      // Only show for non-master users (clients)
      if (user.role === "master") return;

      const userId = getUserIdFromToken();
      if (!userId) return;

      // Fetch regular notifications with update type
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
      const convertedNotifications = updateNotifications.map((n: any) => ({
        _id: n.entityId,
        title: n.title,
        description: n.message,
        version: n.metadata?.updateVersion || 'Unknown',
        features: n.metadata?.features || [], // Features are now stored in metadata
        exploredSections: [],
        dismissed: n.read,
        propagatedToClients: true,
        createdAt: n.createdAt
      }));

      setNotifications(convertedNotifications);
    } catch (error) {
      console.error("Error fetching update notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark notification as read when walkthrough is completed
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const userId = getUserIdFromToken();

      if (!userId) return;

      // Find the actual notification ID from regular notifications
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

      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Get all features from all notifications for the walkthrough
  const allFeatures = notifications.flatMap(notification =>
    notification.features.map(feature => ({
      ...feature,
      notificationTitle: notification.title,
      version: notification.version
    }))
  );

  const totalSteps = allFeatures.length;
  const currentFeature = allFeatures[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTryItNow = () => {
    if (currentFeature) {
      router.push(currentFeature.sectionUrl);
      // Don't close the modal, let user continue the walkthrough
    }
  };

  const handleComplete = async () => {
    // Mark all notifications as read
    for (const notification of notifications) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  // Don't show anything for master admins or if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* New Badge */}
      <Badge
        variant="default"
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer animate-pulse"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        New Updates
      </Badge>

      {/* Walkthrough Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                🚀 What's New in {currentFeature?.version || 'Latest Update'}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {currentFeature && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{currentFeature.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {currentFeature.notificationTitle}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {currentFeature.description}
                  </p>

                  {currentFeature.gifUrl && (
                    <div className="flex justify-center">
                      <img
                        src={currentFeature.gifUrl}
                        alt={`${currentFeature.name} feature demonstration`}
                        className="max-w-full max-h-64 rounded-lg border shadow-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Pro tip:</strong> Try this feature to see the improvements firsthand.
                    </p>
                    <Button
                      onClick={handleTryItNow}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Try it now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button onClick={handleComplete} className="bg-gradient-to-r from-green-500 to-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Got it!
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateWalkthrough;