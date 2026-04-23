import { apiRequest } from './api-client';
import { ClosetItem } from '@/data/mockItems';

export async function fetchItems(token: string): Promise<ClosetItem[]> {
  return apiRequest<ClosetItem[]>('/items', {
    method: 'GET',
  }, token);
}
