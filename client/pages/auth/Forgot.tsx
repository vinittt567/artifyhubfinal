import { AppShell } from "@/components/app/AppShell";
import { AuthCard } from "@/components/app/AuthCard";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email",
          variant: "destructive"
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Email sent",
          description: "Check your email for password reset instructions",
        });
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

  if (emailSent) {
    return (
      <AppShell centered mainClassName="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.22),transparent_60%)]" />
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">We've sent a password reset link to {email}</p>
        </div>
        <AuthCard>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Try different email
              </Button>
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        </AuthCard>
      </AppShell>
    );
  }

  return (
    <AppShell centered mainClassName="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.22),transparent_60%)]" />
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We will send a reset link to your email</p>
      </div>
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered your password? <Link to="/login" className="text-brand hover:underline">Back to login</Link>
          </p>
        </form>
      </AuthCard>
    </AppShell>
  );
}
