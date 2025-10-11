import { AppShell } from "@/components/app/AppShell";
import { AuthCard } from "@/components/app/AuthCard";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/feed';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to sign in",
          variant: "destructive"
        });
      } else {
        const from = location.state?.from?.pathname || '/feed';
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell centered mainClassName="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.22),transparent_60%)]" />
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
      </div>
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-brand hover:underline">
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-brand hover:underline">Create an account</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Having issues? <Link to="/setup" className="text-brand hover:underline">Setup guide</Link> | <Link to="/debug" className="text-brand hover:underline">Debug tools</Link>
          </p>
        </form>
      </AuthCard>
    </AppShell>
  );
}
