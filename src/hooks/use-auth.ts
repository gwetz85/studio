import { useAuthContext } from "@/providers/auth-provider"

export type { UserRole } from "@/providers/auth-provider"

export function useAuth() {
  return useAuthContext()
}
