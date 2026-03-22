export type Category = 'Tops' | 'Bottoms' | 'Shoes' | 'Outerwear' | 'Accessories';

export interface ClosetItem {
  id: string;
  imageUrl: string;
  category: Category;
  color: string;
  lastWorn: string; // ISO date string
  wearCount: number;
  isDormant: boolean; // e.g., not worn in 60 days
}

export const mockItems: ClosetItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
    category: 'Tops',
    color: 'White',
    lastWorn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    wearCount: 15,
    isDormant: false,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
    category: 'Bottoms',
    color: 'Blue',
    lastWorn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    wearCount: 22,
    isDormant: false,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80',
    category: 'Shoes',
    color: 'White',
    lastWorn: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 days ago
    wearCount: 3,
    isDormant: true,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    category: 'Outerwear',
    color: 'Black',
    lastWorn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    wearCount: 8,
    isDormant: false,
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80',
    category: 'Tops',
    color: 'Black',
    lastWorn: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
    wearCount: 1,
    isDormant: true,
  },
];
