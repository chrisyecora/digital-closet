import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { fetchItems } from '@/services/items-service';

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
