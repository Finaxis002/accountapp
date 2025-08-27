'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginUser, getCurrentUser } from "@/lib/auth";

export default function UserLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

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
    setIsLoading(true);
    try {
      const user = await loginUser(userId, password);

      // optional: if you want tenant-level information from user.companies or createdByClient,
      // you can persist it here as needed (e.g. localStorage.setItem("createdByClient", ...))

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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign In
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
