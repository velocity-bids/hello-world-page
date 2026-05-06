import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { supabase } from "@/integrations/supabase/client";
import { getOwnProfile } from "@/db/queries";
import { updateProfile } from "@/db/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { isAtLeastAge } from "@/lib/age-utils";

const ProfileSettings = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await getOwnProfile(user?.id || "");
      if (error) throw error;

      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setAddress(data.address || "");
        setDateOfBirth(data.date_of_birth || "");
        setIdDocumentUrl(data.id_document_url || "");
        setAvatarUrl((data as any).avatar_url || "");
      }
    } catch (error: unknown) {
      toast.error(t("translation:profile.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("translation:profile.fileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("id-documents").upload(fileName, file);
      if (uploadError) throw uploadError;

      setIdDocumentUrl(fileName);
      toast.success(t("translation:profile.idUploaded"));
    } catch (error: unknown) {
      toast.error(t("translation:profile.idUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateOfBirth && !isAtLeastAge(dateOfBirth, 18)) {
      toast.error(t("translation:profile.mustBeAdultError"));
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile(user?.id || "", {
        display_name: displayName,
        bio,
        address,
        date_of_birth: dateOfBirth || null,
        id_document_url: idDocumentUrl || null,
        avatar_url: avatarUrl || null,
      });

      if (error) throw error;
      toast.success(t("translation:profile.updated"));
    } catch (error: unknown) {
      toast.error(t("translation:profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="container mx-auto flex-1 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">{t("translation:profile.title")}</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>{t("translation:profile.profilePhoto")}</Label>
              <AvatarUpload
                userId={user?.id || ""}
                currentAvatarUrl={avatarUrl}
                displayName={displayName}
                onAvatarChange={setAvatarUrl}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{t("translation:profile.displayName")}</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("translation:profile.yourName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("translation:profile.email")}</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">{t("translation:profile.emailImmutable")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t("translation:profile.dateOfBirth")}</Label>
              <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} required />
              <p className="text-sm text-muted-foreground">{t("translation:profile.mustBeAdult")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("translation:profile.address")}</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("translation:profile.yourAddress")} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("translation:profile.bio")}</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("translation:profile.tellUsAboutYourself")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDocument">{t("translation:profile.idDocument")}</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('idDocument')?.click()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {t("translation:profile.uploadId")}
                </Button>
                <Input id="idDocument" type="file" accept="image/*,.pdf" onChange={handleIdUpload} className="hidden" />
                {idDocumentUrl && <span className="text-sm text-muted-foreground">✓ {t("translation:profile.documentUploaded")}</span>}
              </div>
              <p className="text-sm text-muted-foreground">{t("translation:profile.idDocumentHelp")}</p>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("translation:profile.saving")}
                </>
              ) : (
                t("translation:profile.saveChanges")
              )}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
};

export default ProfileSettings;
