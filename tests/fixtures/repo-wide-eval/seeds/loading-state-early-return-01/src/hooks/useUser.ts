// useUser returns `user: null` while the initial fetch is in flight.
// Every existing consumer (Profile, Header, Settings) early-returns on
// `loading` before reading `user.<field>` — see the deleted line in the
// diff. Removing that guard while keeping the same hook contract is a
// runtime crash because `user.name` will be `null.name`.

import { useEffect, useState } from 'react';

export function useUser(): {
  user: { name: string } | null;
  loading: boolean;
  error: Error | null;
} {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch((e) => {
        setError(e);
        setLoading(false);
      });
  }, []);

  return { user, loading, error };
}
