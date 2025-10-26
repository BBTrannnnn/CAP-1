// app/(tabs)/habits/AddHabitModal.tsx
import React, { useMemo, useState } from 'react';
import { Stack, Link, router } from 'expo-router';
import {
  View, Text, SafeAreaView, ScrollView, TextInput,
  StyleSheet, Pressable, TouchableOpacity,
  StyleProp, ViewStyle, TextStyle, ImageStyle,
} from 'react-native';
import { X, Search, Plus, Check } from '@tamagui/lucide-icons';

// Helper: flatten mọi style mảng -> object (an toàn web/DOM/SVG)
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type HabitItem = { icon: string; name: string; category: string; color: string };
type Categories = Record<string, HabitItem[]>;

function withAlpha(hex: string, alpha = 0.12) {
  // hex #RRGGBB -> rgba(r,g,b,a)
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AddHabitModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const categories: Categories = useMemo(
    () => ({
      'Sức khỏe': [
        { icon: '🏃', name: 'Ăn uống lành mạnh', category: 'Healthy',  color: '#10b981' },
        { icon: '⭐', name: 'Tập thể dục',       category: 'Fitness',  color: '#f97316' },
        { icon: '💧', name: 'Uống nước đủ',      category: 'Health',   color: '#a78bfa' },
      ],
      'Tinh thần': [
        { icon: '💗', name: 'Thiền định',        category: 'Mindful',  color: '#ec4899' },
        { icon: '📖', name: 'Viết nhật ký',      category: 'Mindful',  color: '#8b5cf6' },
        { icon: '📚', name: 'Đọc sách',          category: 'Learning', color: '#10b981' },
        { icon: '🧘', name: 'Cảm ơn',            category: 'Mindful',  color: '#f59e0b' },
        { icon: '✨', name: 'Học ngoại ngữ',     category: 'Learning', color: '#a78bfa' },
      ],
      'Kiểm soát': [
        { icon: '🚭', name: 'Không hút thuốc',                     category: 'Control', color: '#9ca3af' },
        { icon: '🍷', name: 'Không uống rượu',                     category: 'Control', color: '#ec4899' },
        { icon: '☕', name: 'Ít coffee',                            category: 'Control', color: '#f97316' },
        { icon: '💰', name: 'Tiết kiệm tiền',                      category: 'Finance', color: '#10b981' },
        { icon: '📱', name: 'Không xem điện thoại trước khi ngủ',  category: 'Control', color: '#6b7280' },
      ],
    }),
    []
  );

  const filtered: Categories = useMemo(() => {
    const f: Categories = {};
    const q = searchTerm.trim().toLowerCase();
    Object.keys(categories).forEach(cat => {
      const items = categories[cat].filter(h => h.name.toLowerCase().includes(q));
      if (items.length) f[cat] = items;
    });
    return f;
  }, [categories, searchTerm]);

  const canContinue = !!selectedKey;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tạo thói quen mới</Text>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={styles.iconBtn}>
            <X size={20} color="#111827" />
          </Pressable>
        </Link>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={styles.searchBox}>
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Tìm kiếm thói quen..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        {Object.keys(filtered).length ? (
          Object.keys(filtered).map((cat) => (
            <View key={cat} style={{ marginBottom: 20 }}>
              <Text style={styles.sectionLabel}>{cat}</Text>

              {filtered[cat].map((habit, idx) => {
                const key = `${cat}-${idx}`;
                const selected = selectedKey === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedKey(key)}
                    style={sx(
                      styles.itemRow,
                      selected && { backgroundColor: '#f0fdf4' }
                    )}
                  >
                    <View
                      style={sx(
                        styles.iconSquare,
                        { backgroundColor: withAlpha(habit.color, 0.12), borderColor: withAlpha(habit.color, 0.4) }
                      )}
                    >
                      <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{habit.name}</Text>
                      <Text style={styles.itemCat} numberOfLines={1}>{habit.category}</Text>
                    </View>

                    {selected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={{ color: '#9ca3af' }}>Không tìm thấy thói quen</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={sx(styles.bottomBtn, { backgroundColor: '#f3f4f6' })}>
            <Text style={sx(styles.bottomText, { color: '#374151' })}>Hủy</Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={() => canContinue && router.push('/(tabs)/habits/CreateHabitDetail')}
          disabled={!canContinue}
          style={sx(
            styles.bottomBtn,
            { backgroundColor: canContinue ? '#2563eb' : '#d1d5db' }
          )}
        >
          <Text style={sx(styles.bottomText, { color: '#fff' })}>Tiếp tục</Text>
        </Pressable>
      </View>

      {/* Custom Habit Button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Link href="/(tabs)/habits/CreateHabitDetail" asChild>
          <TouchableOpacity style={styles.customBtn}>
            <Plus size={18} color="#2563eb" />
            <Text style={styles.customBtnText}>Tạo thói quen tùy chỉnh</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    borderRadius: 10, paddingHorizontal: 4,
  },
  iconSquare: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemCat: { fontSize: 12, color: '#6b7280' },

  checkCircle: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },

  emptyBox: {
    height: 200, alignItems: 'center', justifyContent: 'center',
  },

  bottomBar: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  bottomBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  bottomText: { fontSize: 14, fontWeight: '600' },

  customBtn: {
    width: '100%', paddingVertical: 12, borderRadius: 10,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, backgroundColor: 'transparent',
  },
  customBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
