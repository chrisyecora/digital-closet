import { apiRequest } from './api-client';
import { ClosetItem } from '@/data/mockItems';

export async function fetchItems(token: string): Promise<ClosetItem[]> {
  return apiRequest<ClosetItem[]>('/items', {
    method: 'GET',
  }, token);
}

export async function fetchItemDetails(token: string, id: string): Promise<ClosetItem & { name: string; description: string }> {
  return apiRequest<ClosetItem & { name: string; description: string }>(`/items/${id}`, {
    method: 'GET',
  }, token);
}

export async function deleteItem(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/items/${id}`, {
    method: 'DELETE',
  }, token);
}
