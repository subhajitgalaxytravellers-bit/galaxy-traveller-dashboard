import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

function useContentList(modelKey, searchQuery, selectedStatus) {
  return useQuery({
    queryKey: ["content-list", modelKey, searchQuery, selectedStatus],
    queryFn: async () => {
      const params = {};

      // Apply search query
      if (searchQuery) {
        params.q = searchQuery; // Use search query as 'q' parameter for backend
      }

      // Apply status filter
      if (selectedStatus && selectedStatus !== "all") {
        params.status = selectedStatus; // Send status filter if it's not 'all'
      }

      // console.log("params", params);

      // Fetch data with parameters
      const { data } = await api().get(`/api/${modelKey}/moderation`, {
        params,
      });

      if (Array.isArray(data)) return { items: data, total: data.length };
      return {
        items: data.data || [],
        total: data.total ?? (data.items?.length || 0),
      };
    },
    enabled: !!modelKey, // Only run query if modelKey is defined
  });
}

export default useContentList;
