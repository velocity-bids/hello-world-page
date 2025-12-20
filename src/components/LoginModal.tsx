import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Mail } from "lucide-react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { isAtLeastAge } from "@/lib/age-utils";

export const LoginModal = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { isOpen, closeLoginModal } = useAuthModal();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoading(true);
    const result = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    
    if (!result.error) {
      closeLoginModal();
      setLoginEmail("");
      setLoginPassword("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !dateOfBirth) return;

    if (!isAtLeastAge(dateOfBirth, 18)) {
      toast.error("You must be at least 18 years old to sign up");
      return;
    }

    setIsLoading(true);
    const result = await signUp(
      signupEmail,
      signupPassword,
      displayName,
      "1995-08-21",
      address
    );
    setIsLoading(false);
    
    if (!result.error) {
      setShowEmailConfirmation(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    setIsLoading(false);
    if (!result.error) closeLoginModal();
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithApple();
    setIsLoading(false);
    if (!result.error) closeLoginModal();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShowEmailConfirmation(false);
    setSignupEmail("");
    setSignupPassword("");
    setDisplayName("");
    setDateOfBirth("");
    setAddress("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowResetPassword(false);
        setResetEmail("");
        setShowEmailConfirmation(false);
      }
      closeLoginModal();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {showEmailConfirmation 
              ? "Check Your Email" 
              : showResetPassword 
                ? "Reset Password" 
                : "Welcome to BidWheels"
            }
          </DialogTitle>
          <DialogDescription>
            {showEmailConfirmation
              ? "We've sent you a confirmation email"
              : showResetPassword 
                ? "Enter your email to receive a password reset link"
                : "Sign in to your account or create a new one to continue"
            }
          </DialogDescription>
        </DialogHeader>

        {showEmailConfirmation ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Verify your email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <strong>{signupEmail}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please click the link in the email to verify your account before signing in.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
            <Button onClick={resetForm} className="w-full">Got it</Button>
          </div>
        ) : showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowResetPassword(false)} disabled={isLoading}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <OAuthButtons onGoogleClick={handleGoogleSignIn} onAppleClick={handleAppleSignIn} isLoading={isLoading} />
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <button type="button" onClick={() => setShowResetPassword(true)} className="text-sm text-primary hover:underline w-full text-center mt-2">
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <OAuthButtons onGoogleClick={handleGoogleSignIn} onAppleClick={handleAppleSignIn} isLoading={isLoading} />
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name (Optional)</Label>
                  <Input id="display-name" type="text" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="your@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                  <p className="text-sm text-muted-foreground">Password must be at least 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">Date of Birth *</Label>
                  <Input id="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split("T")[0]} required />
                  <p className="text-sm text-muted-foreground">Must be 18 or older</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Your address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">ID upload required later for bidding and listings</p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
