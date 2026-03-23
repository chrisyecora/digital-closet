import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Image, ScrollView } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { mockItems, Category, ClosetItem } from '@/data/mockItems';

const CATEGORIES: { label: string; value: Category | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Tops', value: 'Tops' },
  { label: 'Bottoms', value: 'Bottoms' },
  { label: 'Shoes', value: 'Shoes' },
  { label: 'Outerwear', value: 'Outerwear' },
  { label: 'Accessories', value: 'Accessories' },
];

export default function Dashboard() {
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const primaryColor = useThemeColor({}, 'primary');
  const alternateColor = useThemeColor({}, 'alternate');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const errorColor = useThemeColor({}, 'error');

  const filteredItems = mockItems.filter(
    item => selectedCategory === 'All' || item.category === selectedCategory
  );

  const renderItem = ({ item }: { item: ClosetItem }) => (
    <Pressable 
      style={styles.card}
      onPress={() => router.push(`/(home)/items/${item.id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      {item.isDormant && (
        <View style={[styles.dormantBadge, { backgroundColor: errorColor }]}>
          <ThemedText style={styles.dormantText}>Dormant</ThemedText>
        </View>
      )}
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.category}</ThemedText>
        <ThemedText style={[styles.cardSubtext, { color: secondaryText }]}>
          Worn {item.wearCount}x
        </ThemedText>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.iconStack}>
        <View style={[styles.iconCircle, styles.iconCircleLeft, { backgroundColor: alternateColor }]}>
          <Ionicons name="shirt-outline" size={28} color="#fff" />
        </View>
        <View style={[styles.iconCircle, styles.iconCircleRight, { backgroundColor: alternateColor }]}>
          <Ionicons name="glasses-outline" size={28} color="#fff" />
        </View>
        <View style={[styles.iconCircle, styles.iconCircleCenter, { backgroundColor: primaryColor }]}>
          <Ionicons name="camera-outline" size={48} color="#fff" />
        </View>
      </View>
      <ThemedText type="title" style={styles.emptyTitle}>Your closet is empty</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: secondaryText }]}>
        Start building your digital wardrobe by snapping your first outfit photo.
      </ThemedText>
      <Pressable 
        style={[styles.addButton, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/(home)/(tabs)/camera')}
      >
        <Ionicons name="camera" size={20} color="#fff" style={styles.addButtonIcon} />
        <ThemedText style={styles.addButtonText}>Snap First Outfit</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">Closet</ThemedText>
            <ThemedText style={{ color: secondaryText }}>
              {mockItems.length} items
            </ThemedText>
          </View>
          <Pressable onPress={() => signOut()} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color={primaryColor} />
          </Pressable>
        </View>

        {mockItems.length > 0 && (
          <View style={styles.filtersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedCategory === cat.value ? primaryColor : 'transparent',
                      borderColor: selectedCategory === cat.value ? primaryColor : alternateColor,
                    }
                  ]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <ThemedText 
                    style={[
                      styles.filterText,
                      { color: selectedCategory === cat.value ? '#fff' : secondaryText }
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listContainer}>
          {mockItems.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlashList
              data={filteredItems}
              renderItem={renderItem}
              estimatedItemSize={200}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.categoryEmptyState}>
                  <ThemedText style={styles.categoryEmptyText}>No items found in this category</ThemedText>
                </View>
              }
            />
          )}
        </View>

        {mockItems.length > 0 && (
          <Pressable 
            style={[styles.fab, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/(home)/(tabs)/camera')}
            accessibilityLabel="Add item"
          >
            <Ionicons name="add" size={32} color="#fff" />
          </Pressable>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  profileButton: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    margin: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: '#e1e1e1',
  },
  cardContent: {
    padding: 12,
  },
  cardSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  dormantBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dormantText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  iconStack: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircleCenter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    zIndex: 2,
  },
  iconCircleLeft: {
    width: 56,
    height: 56,
    borderRadius: 28,
    left: -10,
    top: 10,
    zIndex: 1,
    transform: [{ rotate: '-15deg' }],
  },
  iconCircleRight: {
    width: 56,
    height: 56,
    borderRadius: 28,
    right: -10,
    bottom: 10,
    zIndex: 1,
    transform: [{ rotate: '15deg' }],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryEmptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  categoryEmptyText: {
    fontSize: 16,
    color: '#888',
  },
});