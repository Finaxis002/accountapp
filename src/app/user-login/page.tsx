'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { loginUser, getCurrentUser } from "@/lib/auth";

export default function UserLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [userId, setUserId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  // ✅ Guard: if already logged in, redirect based on role
  React.useEffect(() => {
    const u = getCurrentUser();
    if (!u) return;

    if (u.role === "master") {
      router.replace("/admin/dashboard");
    } else if (u.role === "admin" || u.role === "customer") {
      router.replace("/dashboard");
    } else {
      router.replace("/user-dashboard");
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: "reCAPTCHA Required",
        description: "Please complete the reCAPTCHA verification.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginUser(userId, password, captchaToken);

      // Save the complete user object with all properties including _id
      localStorage.setItem("user", JSON.stringify({
        _id: user._id, // Save the MongoDB ObjectId
        id: user._id, // Also save as id for compatibility
        userName: user.userName,
        userId: user.userId,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
        permissions: user.permissions || [],
        companies: user.companies || [],
        createdByClient: user.createdByClient,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      // Save individual properties for easy access
      localStorage.setItem("_id", user._id);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userName", user.userName || "");
      localStorage.setItem("role", user.role);
      
      // Save companies and createdByClient if they exist
      if (user.companies && user.companies.length > 0) {
        localStorage.setItem("companies", JSON.stringify(user.companies));
      }
      
      if (user.createdByClient) {
        localStorage.setItem("createdByClient", user.createdByClient);
      }

      // Redirect based on role
      if (user.role === "master") {
        router.push("/admin/dashboard");
      } 
      else if(user.role === "admin" || user.role === "customer" || user.role === "client"){
        router.push("/dashboard")
      }
      else {
        router.push("/user-dashboard");
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.userName}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-card border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">User Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your user ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                theme={theme === "dark" ? "dark" : "light"}
                onChange={(token: React.SetStateAction<string | null>) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign In 
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}