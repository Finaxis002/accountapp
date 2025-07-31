"use client";

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
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import React from "react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  // const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // const handleLogin = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const user = login(email);

  //   if (user?.role === "admin") {
  //     router.push("/admin-dashboard");
  //   } else {
  //     router.push("/dashboard");
  //   }
  // };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:5000/api/master-admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // Store token (you can also use cookies if preferred)
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", "admin");
    localStorage.setItem("username", data.admin.username);

    // Redirect to admin dashboard
    router.push("/admin-dashboard");

  } catch (err) {
    console.error(err);
    alert("An error occurred during login.");
  }
};


  // const handleDemoLogin = (role: "admin" | "customer") => {
  //   const demoEmail =
  //     role === "admin" ? "admin@accountech.com" : "client@techcorp.com";
  //   setEmail(demoEmail);
  //   setPassword("admin123"); // Or some dummy password
  //   const user = login(demoEmail);
  //   if (user?.role === "admin") {
  //     router.push("/admin-dashboard");
  //   } else {
  //     router.push("/dashboard");
  //   }
  // };

  const handleDemoLogin = async (role: 'admin' | 'customer') => {
  const demoUsername = role === 'admin' ? 'admin' : 'client';
  const demoPassword = role === 'admin' ? 'admin123' : 'client123';

  try {
    const response = await fetch("http://localhost:5000/api/master-admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: demoUsername,
        password: demoPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // Store token
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("username", data.admin.username);

    // Redirect
    router.push(role === "admin" ? "/admin-dashboard" : "/dashboard");
  } catch (err) {
    console.error(err);
    alert("An error occurred during demo login.");
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
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {/* <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              /> */}
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              type="submit"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </form>
        <div className="px-6 pb-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Demo Accounts
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin("admin")}
          >
            Demo Master Admin
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin("customer")}
          >
            Demo Client
          </Button>

          <div className="text-center text-xs text-muted-foreground/80">
            <p>
              Master Admin:{" "}
              <code className="bg-muted p-1 rounded-sm">
                admin@accountech.com
              </code>{" "}
              / <code className="bg-muted p-1 rounded-sm">admin123</code>
            </p>
            <p>
              Client:{" "}
              <code className="bg-muted p-1 rounded-sm">
                client@techcorp.com
              </code>{" "}
              / <code className="bg-muted p-1 rounded-sm">client123</code>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
