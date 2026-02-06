import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
export function useRoles(withCounts = true) {
  return useQuery({
    queryKey: ["roles", withCounts],
    queryFn: async () => {
      const { data } = await api().get("/api/roles", {
        params: { withCounts: withCounts ? 1 : 0 },
      });
      return data || [];
    },
    staleTime: 60_000,
  });
}

export function useRoleId(roleId) {
  return useQuery({
    queryKey: ["roles", roleId],
    enabled: !!roleId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await api().get(`/api/roles/${roleId}`);
      return data; // role doc
    },
  });
}
