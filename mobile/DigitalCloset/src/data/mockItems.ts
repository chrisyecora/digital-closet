export type Category = 'Tops' | 'Bottoms' | 'Shoes' | 'Outerwear' | 'Accessories';

export interface OutfitHistoryItem {
  id: string;
  imageUrl: string;
  date: string; // ISO date string
}

export interface ClosetItem {
  id: string;
  name?: string;
  imageUrl: string;
  category: Category;
  subCategory?: string;
  color: string;
  lastWorn: string; // ISO date string
  firstLogged: string; // ISO date string
  wearCount: number;
  isDormant: boolean; // e.g., not worn in 60 days
  description?: string;
  outfitHistory: OutfitHistoryItem[];
  wornWith: string[]; // array of ClosetItem IDs
}

export const mockItems: ClosetItem[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
    category: 'Tops',
    subCategory: 'T-Shirt',
    color: 'White',
    lastWorn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    firstLogged: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    wearCount: 15,
    isDormant: false,
    description: 'My favorite plain white t-shirt. Goes with everything.',
    outfitHistory: [
      { id: 'o1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'o2', imageUrl: 'https://images.unsplash.com/photo-1520975954732-57dd22299614?w=500&q=80', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    wornWith: ['2', '4'],
  },
  {
    id: '2',
    name: 'Vintage Blue Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
    category: 'Bottoms',
    subCategory: 'Jeans',
    color: 'Blue',
    lastWorn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    firstLogged: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    wearCount: 22,
    isDormant: false,
    description: 'Comfortable fit, slightly faded.',
    outfitHistory: [
      { id: 'o3', imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    wornWith: ['1', '5'],
  },
  {
    id: '3',
    name: 'White Sneakers',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80',
    category: 'Shoes',
    subCategory: 'Sneakers',
    color: 'White',
    lastWorn: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 days ago
    firstLogged: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    wearCount: 3,
    isDormant: true,
    description: 'Clean and casual.',
    outfitHistory: [], // Empty state test
    wornWith: [], // Empty state test
  },
  {
    id: '4',
    name: 'Leather Jacket',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    category: 'Outerwear',
    subCategory: 'Jacket',
    color: 'Black',
    lastWorn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    firstLogged: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    wearCount: 8,
    isDormant: false,
    outfitHistory: [
      { id: 'o4', imageUrl: 'https://images.unsplash.com/photo-1489987707023-afc7e960f3d5?w=500&q=80', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    wornWith: ['1'],
  },
  {
    id: '5',
    name: 'Black Turtleneck',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80',
    category: 'Tops',
    subCategory: 'Sweater',
    color: 'Black',
    lastWorn: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
    firstLogged: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    wearCount: 1,
    isDormant: true,
    outfitHistory: [],
    wornWith: ['2'],
  },
];