import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.error(t("translation:auth.mustBe18ToSignUp"));
      return;
    }

    setIsLoading(true);
    await signUp(signupEmail, signupPassword, displayName, dateOfBirth, address);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    console.log("🚀 ~ handleGoogleSignIn ~ result:", result)
    if (result.error) setIsLoading(false);
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithApple();
    if (result.error) setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            <span className="text-xl font-bold">{t("translation:nav.brandName")}</span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 shadow-elevated">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t("translation:translation:auth.welcomeBack")}</h1>
            <p className="text-muted-foreground">{t("translation:auth.signInOrCreateShort")}</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("translation:auth.login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("translation:auth.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <OAuthButtons onGoogleClick={handleGoogleSignIn} onAppleClick={handleAppleSignIn} isLoading={isLoading} />
              <form onSubmit={handleLogin} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("translation:auth.email")}</Label>
                  <Input id="login-email" type="email" placeholder={t("translation:auth.yourEmail")} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("translation:auth.password")}</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("translation:auth.signingIn") : t("translation:nav.signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <OAuthButtons onGoogleClick={handleGoogleSignIn} onAppleClick={handleAppleSignIn} isLoading={isLoading} />
              <form onSubmit={handleSignup} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">{t("translation:auth.displayName")}</Label>
                  <Input id="display-name" type="text" placeholder={t("translation:auth.yourName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("translation:auth.email")}</Label>
                  <Input id="signup-email" type="email" placeholder={t("translation:auth.yourEmail")} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("translation:auth.password")}</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                  <p className="text-sm text-muted-foreground">{t("translation:auth.passwordMin")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">{t("translation:auth.dateOfBirth")}</Label>
                  <Input id="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split("translation:T")[0]} required />
                  <p className="text-sm text-muted-foreground">{t("translation:auth.mustBeAdult")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("translation:auth.address")}</Label>
                  <Textarea id="address" placeholder={t("translation:auth.yourAddress")} value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("translation:auth.creatingAccount") : t("translation:auth.createAccount")}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{t("translation:auth.idUploadRequiredLater")}</p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
