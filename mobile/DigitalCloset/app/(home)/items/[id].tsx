import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { mockItems, ClosetItem } from '@/data/mockItems';

const SKELETON_BG_LIGHT = '#E0E0E0';
const SKELETON_BG_DARK = '#333333';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [item, setItem] = useState<ClosetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemName, setItemName] = useState('');

  // Colors
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const cardColor = useThemeColor({}, 'secondary');
  
  const isDarkMode = backgroundColor === '#1A1918'; // based on theme.ts dark bg
  const skeletonColor = isDarkMode ? SKELETON_BG_DARK : SKELETON_BG_LIGHT;

  useEffect(() => {
    // Simulate API fetch
    const fetchItem = async () => {
      setLoading(true);
      setTimeout(() => {
        const foundItem = mockItems.find(i => i.id === id);
        if (foundItem) {
          setItem(foundItem);
          setItemName(foundItem.name || foundItem.category);
        }
        setLoading(false);
      }, 500);
    };
    
    fetchItem();
  }, [id]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this item from your closet?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            // In a real app, delete API call here
            router.back();
          }
        }
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.imageSkeleton, { backgroundColor: skeletonColor }]} />
        <View style={styles.contentContainer}>
          <View style={[styles.titleSkeleton, { backgroundColor: skeletonColor }]} />
          <View style={styles.tagsContainer}>
            <View style={[styles.tagSkeleton, { backgroundColor: skeletonColor }]} />
            <View style={[styles.tagSkeleton, { backgroundColor: skeletonColor }]} />
            <View style={[styles.tagSkeleton, { backgroundColor: skeletonColor }]} />
          </View>
          <View style={[styles.statsSkeleton, { backgroundColor: skeletonColor }]} />
          
          <View style={[styles.sectionTitleSkeleton, { backgroundColor: skeletonColor }]} />
          <View style={[styles.historySkeleton, { backgroundColor: skeletonColor }]} />
        </View>
        <Pressable 
          style={[styles.backButton, { top: insets.top + 10 }]} 
          onPress={handleGoBack}
        >
          <View style={styles.backButtonBg}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </View>
        </Pressable>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ThemedText>Item not found.</ThemedText>
        <Pressable onPress={handleGoBack} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: primaryColor }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const wornWithItems = mockItems.filter(i => item.wornWith.includes(i.id));

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
        </View>

        <View style={styles.contentContainer}>
          {/* Editable Title */}
          <TextInput
            style={[styles.titleInput, { color: textColor }]}
            value={itemName}
            onChangeText={setItemName}
            placeholder="Item Name"
            placeholderTextColor={secondaryText}
            maxLength={50}
          />
          
          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
            <View style={[styles.tag, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.tagText}>{item.category}</ThemedText>
            </View>
            {item.subCategory && (
              <View style={[styles.tag, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.tagText}>{item.subCategory}</ThemedText>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.tagText}>{item.color}</ThemedText>
            </View>
          </ScrollView>

          {/* Description */}
          {item.description && (
            <ThemedText style={[styles.description, { color: secondaryText }]}>
              {item.description}
            </ThemedText>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.wearCount}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: secondaryText }]}>Worn</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>{formatDate(item.lastWorn)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: secondaryText }]}>Last Worn</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>{formatDate(item.firstLogged)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: secondaryText }]}>First Logged</ThemedText>
            </View>
          </View>

          {/* Outfit History */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Outfit History</ThemedText>
            {item.outfitHistory.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.outfitHistory.map((outfit) => (
                  <View key={outfit.id} style={styles.historyItem}>
                    <Image source={{ uri: outfit.imageUrl }} style={styles.historyImage} />
                    <ThemedText style={[styles.historyDate, { color: secondaryText }]}>
                      {formatDate(outfit.date)}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <ThemedText style={{ color: secondaryText, textAlign: 'center' }}>
                  This item hasn&apos;t been worn yet.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Worn With */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Worn With</ThemedText>
            {wornWithItems.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {wornWithItems.map((relatedItem) => (
                  <Pressable 
                    key={relatedItem.id} 
                    style={styles.relatedItem}
                    onPress={() => router.push(`/(home)/items/${relatedItem.id}`)}
                  >
                    <Image source={{ uri: relatedItem.imageUrl }} style={styles.relatedImage} />
                    <ThemedText numberOfLines={1} style={styles.relatedName}>
                      {relatedItem.name || relatedItem.category}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <ThemedText style={{ color: secondaryText, textAlign: 'center' }}>
                  Wear this item a few more times to see patterns.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable style={[styles.editButton, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.editButtonText}>Edit Details</ThemedText>
            </Pressable>
            
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <ThemedText style={[styles.deleteButtonText, { color: errorColor }]}>
                Delete Item
              </ThemedText>
            </Pressable>
          </View>
          
          {/* Bottom padding for scrollability */}
          <View style={{ height: insets.bottom + 20 }} />
        </View>
      </ScrollView>

      {/* Absolute Back Button */}
      <Pressable 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={handleGoBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.backButtonBg}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 400,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButtonBg: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    padding: 0,
  },
  tagsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  historyItem: {
    marginRight: 16,
    width: 120,
  },
  historyImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  relatedItem: {
    marginRight: 16,
    width: 100,
  },
  relatedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  relatedName: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 10,
    gap: 16,
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton Styles
  imageSkeleton: {
    width: '100%',
    height: 400,
  },
  titleSkeleton: {
    width: '70%',
    height: 36,
    borderRadius: 8,
    marginBottom: 16,
  },
  tagSkeleton: {
    width: 80,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  statsSkeleton: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 30,
    marginTop: 10,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 24,
    borderRadius: 4,
    marginBottom: 12,
  },
  historySkeleton: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
});
