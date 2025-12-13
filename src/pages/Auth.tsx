import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { isAtLeastAge } from "@/lib/age-utils";

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setIsLoading(true);
    await signIn(loginEmail, loginPassword);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !dateOfBirth) return;

    if (!isAtLeastAge(dateOfBirth, 18)) {
      toast.error("You must be at least 18 years old to sign up");
      return;
    }

    setIsLoading(true);
    await signUp(signupEmail, signupPassword, displayName, dateOfBirth, address);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    await signInWithApple();
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            <span className="text-xl font-bold">BidWheels</span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 shadow-elevated">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account or create a new one</p>
          </div>

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
        </Card>
      </main>
    </div>
  );
};

export default Auth;
