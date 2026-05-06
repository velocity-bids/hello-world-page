import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.error(t("translation:auth.mustBe18ToSignUp"));
      return;
    }

    setIsLoading(true);
    const result = await signUp(signupEmail, signupPassword, displayName, "1995-08-21", address);
    setIsLoading(false);

    if (!result.error) {
      setShowEmailConfirmation(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (result.error) setIsLoading(false);
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithApple();
    if (result.error) {
      setIsLoading(false);
      closeLoginModal();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      });
      if (error) throw error;
      toast.success(t("translation:auth.passwordResetSent"));
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || t("translation:auth.resetPasswordFailed"));
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowResetPassword(false);
          setResetEmail("");
          setShowEmailConfirmation(false);
        }
        closeLoginModal();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {showEmailConfirmation
              ? t("translation:auth.checkEmail")
              : showResetPassword
              ? t("translation:auth.resetPassword")
              : t("translation:translation:auth.welcome")}
          </DialogTitle>
          <DialogDescription>
            {showEmailConfirmation
              ? t("translation:auth.checkEmailDescription")
              : showResetPassword
              ? t("translation:auth.resetPasswordDescription")
              : t("translation:auth.signInOrCreate")}
          </DialogDescription>
        </DialogHeader>

        {showEmailConfirmation ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">{t("translation:auth.verifyEmail")}</h3>
              <p className="text-sm text-muted-foreground">{t("translation:auth.confirmationSentToPlain", { email: signupEmail })}</p>
              <p className="text-sm text-muted-foreground">{t("translation:auth.verifyAccountBeforeSignIn")}</p>
              <p className="mt-4 text-xs text-muted-foreground">{t("translation:auth.checkSpam")}</p>
            </div>
            <Button onClick={resetForm} className="w-full">{t("translation:auth.gotIt")}</Button>
          </div>
        ) : showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("translation:auth.email")}</Label>
              <Input id="reset-email" type="email" placeholder={t("translation:auth.yourEmail")} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowResetPassword(false)} disabled={isLoading}>
                {t("translation:auth.back")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? t("translation:auth.sending") : t("translation:auth.sendResetLink")}
              </Button>
            </div>
          </form>
        ) : (
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
                <button type="button" onClick={() => setShowResetPassword(true)} className="mt-2 w-full text-center text-sm text-primary hover:underline">
                  {t("translation:auth.forgotPassword")}
                </button>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
