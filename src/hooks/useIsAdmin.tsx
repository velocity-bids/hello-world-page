import { useState, useEffect } from 'react';
import { checkUserIsAdmin } from '@/db/queries';
import { useAuth } from './useAuth';

// Note: This is a UX convenience check only.
// Actual authorization is enforced by RLS policies on the server side.
// An attacker could manipulate client state to see the admin UI,
// but all admin operations are protected by database-level RLS policies.
export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await checkUserIsAdmin(user.id);

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error checking admin status:', error);
        }
        setIsAdmin(false);
      } else {
        setIsAdmin(data);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
