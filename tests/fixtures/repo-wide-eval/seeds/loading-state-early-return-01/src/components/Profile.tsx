import { useUser } from '../hooks/useUser';

export function Profile() {
  const { user, loading: _loading, error } = useUser();
  if (error) return <p>Error: {error.message}</p>;
  return <div>{user.name}</div>;
}
