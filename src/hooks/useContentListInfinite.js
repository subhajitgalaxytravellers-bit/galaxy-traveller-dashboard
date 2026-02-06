import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function useContentListInfinite(
  modelKey,
  searchQuery,
  selectedStatus,
  paymentStatus
) {
  return useInfiniteQuery({
    // ✅ use a predictable and simple base key
    queryKey: [
      "content-list",
      modelKey,
      searchQuery,
      selectedStatus,
      paymentStatus,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: 20,
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedStatus && selectedStatus !== "all")
        params.status = selectedStatus;
      if (paymentStatus && paymentStatus !== "all")
        params.paymentStatus = paymentStatus;

      const { data } = await api().get(`/api/${modelKey}/moderation`, {
        params,
      });

      // ✅ normalize API response shape
      const items = data?.data?.items || data?.data || data?.items || [];
      const page = data?.data?.page ?? pageParam;
      const totalPages =
        data?.data?.totalPages ?? Math.ceil((data?.data?.total || 0) / 20);

      return { items, page, totalPages };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!modelKey,
  });
}
