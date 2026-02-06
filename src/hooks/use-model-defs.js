// src/hooks/use-model-defs.js
import api from "@/lib/api"; // your axios factory
import { useQuery } from "@tanstack/react-query";

export function useModelDefs() {
  return useQuery({
    queryKey: ["model-defs"],
    queryFn: async () => {
      const { data } = await api().get("/api/models");
      return data; // [{ key, name, collectionType: "Collection"|"Singleton", singleton?:bool, ui?:{icon} }, ...]
    },
    staleTime: 60_000,
  });
}
