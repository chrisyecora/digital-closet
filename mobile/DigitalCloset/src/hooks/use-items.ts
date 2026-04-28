import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { fetchItems, fetchItemDetails, deleteItem } from '@/services/items-service';

export function useItems() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return fetchItems(token);
    },
  });
}

export function useItemDetail(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['items', id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return fetchItemDetails(token, id);
    },
    enabled: !!id,
  });
}

export function useDeleteItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return deleteItem(token, id);
    },
    onSuccess: () => {
      // Invalidate the items list to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
