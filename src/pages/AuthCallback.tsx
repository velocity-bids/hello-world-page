import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(() => window.location.replace("/hello-world-page/"));
  }, []);

  return <div>Signing you in…</div>;
}
