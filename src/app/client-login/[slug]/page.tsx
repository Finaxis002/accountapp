'use client';


import React, { useEffect } from "react"; // 👈 add useEffect here
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, LogIn , Mail} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginClientBySlug, getCurrentUser } from "@/lib/auth";
import {
  getCurrentUserNew as getSession,
  saveSession,
  scheduleAutoLogout,
} from "@/lib/authSession";
import { requestClientOtp, loginClientBySlugWithOtp } from "@/lib/auth"; 


export default function ClientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { slug } = useParams() as { slug: string };

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // OTP state
  const [tab, setTab] = React.useState<"password" | "otp">("password");
  const [otp, setOtp] = React.useState("");
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0); // seconds
   // ✅ guard: if already logged in, never show client login
  React.useEffect(() => {
    const s = getSession();          // null if token missing/expired (also clears it)
    if (!s) return;    
    const u = getCurrentUser();
    if (u) {
      if (u.role === "customer") router.replace("/dashboard"); // or "/"
      else if (u.role === "master") router.replace("/admin/dashboard");
    }
  }, [router]);

   // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);


// const onSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setIsLoading(true);
//   try {
//     // pass slug FIRST
//     const user = await loginClientBySlug(slug, username, password);

//     if (String(user?.role || '').toLowerCase() === 'customer') {
//       // (optional) persist for later API calls
//       localStorage.setItem('tenantSlug', slug);

//       router.push('/dashboard');
//       toast({
//         title: 'Login Successful',
//         description: `Welcome back, ${user.name}!`,
//       });
//     } else {
//       throw new Error('Invalid customer credentials.');
//     }
//   } catch (error) {
//     toast({
//       variant: 'destructive',
//       title: 'Login Failed',
//       description: error instanceof Error ? error.message : 'Something went wrong.',
//     });
//   } finally {
//     setIsLoading(false);
//   }
// };


const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Login (slug first)
    const user = await loginClientBySlug(slug, username, password);

    // Validate
    const isCustomer = String(user?.role || "").toLowerCase() === "customer";
    if (!isCustomer || !user?.token) {
      throw new Error("Invalid customer credentials.");
    }

    // Persist for authSession (expiry-aware)
    saveSession(user.token, {
      role: "customer",
      username: user.username,
      name: user.name,
      email: user.email,
      slug,
    });

    // Keep legacy/local keys other parts of the app use
    localStorage.setItem("tenantSlug", slug);
    localStorage.setItem("slug", slug);
    localStorage.setItem("role", "customer");
    localStorage.setItem("username", user.username || "");

    // Auto-logout exactly at JWT expiry → back to this tenant’s login page
    scheduleAutoLogout(user.token, () => {
      const tenant =
        localStorage.getItem("tenantSlug") ||
        localStorage.getItem("slug") ||
        localStorage.getItem("clientUsername") ||
        slug; // fallback to URL param
      localStorage.clear();
      router.replace(`/client-login/${tenant}`);
    });

    // Success
    router.push("/dashboard");
    toast({
      title: "Login Successful",
      description: `Welcome back, ${user.name}!`,
    });
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

  
const onSendOtp = async () => {
    if (!username.trim()) {
      toast({ variant: "destructive", title: "Username required", description: "Enter your client username first." });
      return;
    }
    if (resendIn > 0) return; // still throttled

    setSendingOtp(true);
    try {
      await requestClientOtp(slug, username); // calls /api/clients/:slug/request-otp
      setResendIn(45); // match server throttle
      toast({ title: "OTP sent", description: "Check your registered email for the OTP." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // ------------------------
  // OTP: verify/login
  // ------------------------
  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginClientBySlugWithOtp(slug, username, otp); // calls /api/clients/:slug/login-otp
      const isCustomer = String(user?.role || "").toLowerCase() === "customer";
      if (!isCustomer || !user?.token) throw new Error("Invalid OTP.");

      saveSession(user.token, {
        role: "customer",
        username: user.username,
        name: user.name,
        email: user.email,
        slug,
      });

      localStorage.setItem("tenantSlug", slug);
      localStorage.setItem("slug", slug);
      localStorage.setItem("role", "customer");
      localStorage.setItem("username", user.username || "");

      scheduleAutoLogout(user.token, () => {
        const tenant =
          localStorage.getItem("tenantSlug") ||
          localStorage.getItem("slug") ||
          localStorage.getItem("clientUsername") ||
          slug;
        localStorage.clear();
        router.replace(`/client-login/${tenant}`);
      });

      router.push("/dashboard");
      toast({ title: "Login Successful", description: `Welcome back, ${user.name}!` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "OTP Login Failed",
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
          <CardTitle className="text-2xl font-bold">Client Login</CardTitle>
          <CardDescription>Tenant: <span className="font-mono">{slug}</span></CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "password" | "otp")} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            {/* Password tab (existing) */}
            <TabsContent value="password">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      disabled={isLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* OTP tab */}
            <TabsContent value="otp">
              <form onSubmit={onSubmitOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-otp">Username</Label>
                  <Input
                    id="username-otp"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading || sendingOtp}
                    autoComplete="username"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onSendOtp}
                    disabled={sendingOtp || !username || resendIn > 0}
                    className="flex-1"
                  >
                    {sendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Send OTP"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Verify & Sign In
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
  // return (
  //   <div className="flex items-center justify-center min-h-screen bg-background p-4">
  //     <Card className="w-full max-w-sm shadow-2xl bg-card border">
  //       <CardHeader className="space-y-2 text-center">
  //         <CardTitle className="text-2xl font-bold">Client Login</CardTitle>
  //         <CardDescription>Tenant: <span className="font-mono">{slug}</span></CardDescription>
  //       </CardHeader>

  //       <form onSubmit={onSubmit}>
  //         <CardContent className="space-y-4 pt-6">
  //           <div className="space-y-2">
  //             <Label htmlFor="username">Username</Label>
  //             <Input
  //               id="username"
  //               type="text"
  //               required
  //               value={username}
  //               onChange={(e) => setUsername(e.target.value)}
  //               disabled={isLoading}
  //             />
  //           </div>

  //           <div className="space-y-2">
  //             <Label htmlFor="password">Password</Label>
  //             <div className="relative">
  //               <Input
  //                 id="password"
  //                 type={showPassword ? 'text' : 'password'}
  //                 required
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //                 className="pr-10"
  //                 disabled={isLoading}
  //               />
  //               <button
  //                 type="button"
  //                 onClick={() => setShowPassword((s) => !s)}
  //                 className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
  //                 disabled={isLoading}
  //               >
  //                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  //               </button>
  //             </div>
  //           </div>

  //           <Button type="submit" className="w-full" disabled={isLoading}>
  //             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
  //             Sign In
  //           </Button>
  //         </CardContent>
  //       </form>
  //     </Card>
  //   </div>
  // );
}
