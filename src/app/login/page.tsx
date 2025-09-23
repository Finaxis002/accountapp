"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTheme } from "next-themes";
import { loginMasterAdmin } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import {getCurrentUserNew as getSession, saveSession, scheduleAutoLogout } from "@/lib/authSession";



export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [loginType, setLoginType] = React.useState<"admin" | "customer">(
    "admin"
  );

    // ✅ guard: if already logged in, never show login
  // useEffect(() => {
  //   const u = getCurrentUser();
  //   if (u) {
  //     if (u.role === "master") router.replace("/admin/dashboard");
  //     else if (u.role === "customer") router.replace("/dashboard"); // or "/"
  //   }
  // }, [router]);

  useEffect(() => {
  const s = getSession();        // null if token missing/expired (also clears it)
  if (!s) return;                // stay on login
  const u = getCurrentUser();    // your existing role-based user object
  if (u?.role === "master") router.replace("/admin/dashboard");
  else if (u?.role === "customer") router.replace("/dashboard");
}, [router]);


  const handleAdminLogin = async (e: React.FormEvent) => {
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
      const user = await loginMasterAdmin(username, password, captchaToken);
      // if (user) {
      //   router.push("/admin/dashboard");
      //   toast({
      //     title: "Login Successful",
      //     description: `Welcome back!`,
      //   });
      // }
       if (user?.token) {
      // persist for authSession-aware code
      saveSession(user.token, {
        role: user.role ?? "master",
        username: user.username,
        name: user.name,
        email: user.email,
      });

      // keep these if other parts of the app read them
      localStorage.setItem("role", user.role ?? "master");
      localStorage.setItem("username", user.username ?? "");

      // auto-logout exactly at JWT expiry
      scheduleAutoLogout(user.token, () => {
        localStorage.clear();
        router.replace("/login");
      });

      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/admin/dashboard");
    } else {
      throw new Error("Invalid login response");
    }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (loginType === "admin") {
      handleAdminLogin(e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-card border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            AccounTech Pro
          </CardTitle>
          <CardDescription>Professional Accounting Software</CardDescription>
        </CardHeader>

        <form onSubmit={handleFormSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
                disabled={isLoading}
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
                  className="bg-background pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              type="submit"
              disabled={isLoading || !captchaToken}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
