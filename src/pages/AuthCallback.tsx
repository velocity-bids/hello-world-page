import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(() => window.location.replace("/"));
  }, []);

  return <div>Signing you in…</div>;
}
