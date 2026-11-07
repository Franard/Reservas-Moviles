import { useAuthContext } from '@/contextos/AuthContext';

export function useAuth() {
  return useAuthContext();
}

