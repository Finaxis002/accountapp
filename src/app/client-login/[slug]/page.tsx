'use client';


import React, { useEffect } from "react"; // 👈 add useEffect here
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginClientBySlug, getCurrentUser } from "@/lib/auth";

export default function ClientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { slug } = useParams() as { slug: string };

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

   // ✅ guard: if already logged in, never show client login
  React.useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      if (u.role === "customer") router.replace("/dashboard"); // or "/"
      else if (u.role === "master") router.replace("/admin/dashboard");
    }
  }, [router]);

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    // pass slug FIRST
    const user = await loginClientBySlug(slug, username, password);

    if (String(user?.role || '').toLowerCase() === 'customer') {
      // (optional) persist for later API calls
      localStorage.setItem('tenantSlug', slug);

      router.push('/dashboard');
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user.name}!`,
      });
    } else {
      throw new Error('Invalid customer credentials.');
    }
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: error instanceof Error ? error.message : 'Something went wrong.',
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

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
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
