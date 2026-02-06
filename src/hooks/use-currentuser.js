import api from "@/lib/api";
import { getToken } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  const enabled = typeof window !== "undefined" && !!getToken();
  return useQuery({
    queryKey: ["me"],
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => (err?.status === 401 ? false : count < 2),
    queryFn: async () => {
      const { data } = await api().get("/api/users/me");

      return data || null;
    },
  });
}
