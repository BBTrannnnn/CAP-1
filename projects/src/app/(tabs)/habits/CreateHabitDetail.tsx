// app/(tabs)/habits/CreateHabitDetail.tsx
import React, { useMemo, useState } from 'react';
import { Stack, Link } from 'expo-router';
import {
  View, Text, SafeAreaView, ScrollView, StyleSheet,
  Pressable, TextInput, TouchableOpacity, Modal, Platform,
  StyleProp, ViewStyle, TextStyle, ImageStyle
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { X, ChevronLeft, Check, MoreVertical } from '@tamagui/lucide-icons';

// Helper: flatten mọi style mảng -> object (an toàn web/DOM/SVG)
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type Freq = 'daily' | 'weekly' | 'custom';
type Repeat = 'everyday' | 'avoid';

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CreateHabitDetail() {
  const [habitName, setHabitName] = useState('Ăn uống lành mạnh');
  const [selectedIcon, setSelectedIcon] = useState('🏃');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [frequency, setFrequency] = useState<Freq>('daily');
  const [customFrequency, setCustomFrequency] = useState('3');
  const [repeatType, setRepeatType] = useState<Repeat>('everyday');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Health']);

  const [actionOpen, setActionOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Dates
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const invalidRange = !!(endDate && endDate < startDate);

  const icons = useMemo(
    () => ['🍎','🏃','⏰','💝','📚','💻','📱','🧘','💰','😊','💤','⚡','🎯','📖','✏️','🏠','🎵','🍵','💧','🥬','🏥','👟','👥'],
    [],
  );
  const colors = ['#10b981','#f97316','#3b82f6','#ec4899','#6366f1','#ef4444','#22c55e','#f59e0b','#8b5cf6','#9ca3af'];
  const frequencies = [
    { id: 'daily', label: 'Hằng ngày' },
    { id: 'weekly', label: 'Hằng tuần' },
    { id: 'custom', label: 'Tùy chỉnh' },
  ] as const;
  const repeatTypes = [
    { id: 'everyday', label: 'Làm',   Icon: Check },
    { id: 'avoid',    label: 'Tránh', Icon: X },
  ] as const;
  const categories = [
    { id: 'Health',   label: 'Health',   icon: '🏋️', color: '#ec4899' },
    { id: 'Fitness',  label: 'Fitness',  icon: '⚡',  color: '#f97316' },
    { id: 'Learning', label: 'Learning', icon: '📚', color: '#10b981' },
    { id: 'Mindful',  label: 'Mindful',  icon: '🧘', color: '#8b5cf6' },
    { id: 'Finance',  label: 'Finance',  icon: '💰', color: '#10b981' },
    { id: 'Digital',  label: 'Digital',  icon: '📱', color: '#6b7280' },
    { id: 'Social',   label: 'Social',   icon: '👥', color: '#f59e0b' },
    { id: 'Control',  label: 'Control',  icon: '🎯', color: '#ef4444' },
    { id: 'Sleep',    label: 'Sleep',    icon: '😴', color: '#8b5cf6' },
    { id: 'Energy',   label: 'Energy',   icon: '⚡',  color: '#f59e0b' },
  ];

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Web date input handler
  const handleWebDateChange = (which: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (which === 'start') {
      setStartDate(date);
      if (endDate && endDate < date) setEndDate(date);
    } else {
      setEndDate(date);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={sx(styles.card, styles.header)}>
        <View style={styles.headerLeft}>
          <Link href="/(tabs)/habits/AddHabitModal" asChild>
            <Pressable style={sx(styles.iconBtn, { backgroundColor: '#2563eb' })}>
              <ChevronLeft size={20} color="#fff" />
            </Pressable>
          </Link>
          <View>
            <Text style={styles.title}>Chi tiết thói quen</Text>
            <Text style={sx(styles.small, { color: '#2563eb', fontWeight: '700' })}>Quay lại</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.iconGhost} onPress={() => setActionOpen(true)}>
            <MoreVertical size={20} color="#0f172a" />
          </Pressable>
          <Link href="/(tabs)/habits" asChild>
            <Pressable style={styles.iconGhost}>
              <X size={18} color="#0f172a" />
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Action menu (modal) */}
      <Modal visible={actionOpen} transparent animationType="fade" onRequestClose={() => setActionOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setActionOpen(false)}>
          <Pressable style={styles.menu} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setActionOpen(false)}>
              <Text style={styles.menuText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setActionOpen(false); setConfirmOpen(true); }}>
              <Text style={sx(styles.menuText, { color: '#dc2626' })}>Xóa</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Tên thói quen */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Tên thói quen</Text>
          <TextInput
            style={styles.input}
            value={habitName}
            onChangeText={setHabitName}
            placeholder="VD: Uống 2L nước"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Ngày bắt đầu / kết thúc */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          
          {Platform.OS === 'web' ? (
            /* Web: Sử dụng HTML input date */
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bắt đầu</Text>
                <View style={styles.webInputWrapper}>
                  <input
                    type="date"
                    value={fmtDate(startDate)}
                    onChange={(e) => handleWebDateChange('start', e.target.value)}
                    style={{
                      width: 'calc( 100% - 24px )',
                      height: 36,
                      borderRadius: 999,
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      paddingLeft: 12,
                      paddingRight: 12,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#0f172a',
                      textAlign: 'center',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kết thúc</Text>
                <View style={styles.webInputWrapper}>
                  <input
                    type="date"
                    value={endDate ? fmtDate(endDate) : ''}
                    min={fmtDate(startDate)}
                    onChange={(e) => handleWebDateChange('end', e.target.value)}
                    style={{
                      width: 'calc( 100% - 24px )',
                      height: 36,
                      borderRadius: 999,
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      paddingLeft: 12,
                      paddingRight: 12,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#0f172a',
                      textAlign: 'center',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            /* Mobile: Sử dụng DateTimePickerModal */
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bắt đầu</Text>
                <Pressable style={styles.datePill} onPress={() => setPickerMode('start')}>
                  <Text style={styles.dateText}>{fmtDate(startDate)}</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kết thúc</Text>
                <Pressable style={styles.datePill} onPress={() => setPickerMode('end')}>
                  <Text style={styles.dateText}>{endDate ? fmtDate(endDate) : '—'}</Text>
                </Pressable>
              </View>
            </View>
          )}
          
          {invalidRange && (
            <Text style={styles.error}>Ngày kết thúc phải ≥ ngày bắt đầu.</Text>
          )}
        </View>

        {/* Modal hiển thị lịch cho mobile */}
        {Platform.OS !== 'web' && (
          <DateTimePickerModal
            isVisible={!!pickerMode}
            mode="date"
            date={pickerMode === 'start' ? startDate : (endDate ?? startDate)}
            minimumDate={pickerMode === 'end' ? startDate : undefined}
            onConfirm={(date) => {
              if (pickerMode === 'start') {
                setStartDate(date);
                if (endDate && endDate < date) setEndDate(date);
              } else if (pickerMode === 'end') {
                setEndDate(date);
              }
              setPickerMode(null);
            }}
            onCancel={() => setPickerMode(null)}
          />
        )}

        {/* Icon */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Icon</Text>
          <View style={styles.wrapRow}>
            {icons.map((icon, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedIcon(icon)}
                style={sx(
                  styles.iconCell,
                  { borderColor: selectedIcon === icon ? selectedColor : '#e5e7eb',
                    backgroundColor: selectedIcon === icon ? '#00000008' : '#fff' }
                )}
              >
                <Text style={{ fontSize: 20 }}>{icon}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Màu */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Màu sắc</Text>
          <View style={styles.wrapRow}>
            {colors.map((c, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedColor(c)}
                style={sx(
                  styles.colorDot,
                  { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1 }
                )}
              />
            ))}
          </View>
        </View>

        {/* Tần suất */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Tần suất</Text>
          <View style={styles.segmentRow}>
            {(frequencies as readonly {id: Freq; label: string}[]).map(f => (
              <Pressable
                key={f.id}
                onPress={() => setFrequency(f.id)}
                style={sx(
                  styles.segment,
                  frequency === f.id && styles.segmentActive
                )}
              >
                <Text style={sx(
                  styles.segmentText,
                  frequency === f.id && { color: '#2563eb' }
                )}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {frequency === 'custom' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <TextInput
                style={sx(styles.input, { width: 88, height: 40, paddingVertical: 8 })}
                value={customFrequency}
                onChangeText={setCustomFrequency}
                keyboardType="number-pad"
              />
              <Text style={styles.small}>lần/tuần</Text>
            </View>
          )}
        </View>

        {/* Loại thói quen */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Loại thói quen</Text>
          <View style={styles.segmentRow}>
            {repeatTypes.map(({ id, label, Icon }) => (
              <Pressable
                key={id}
                onPress={() => setRepeatType(id as Repeat)}
                style={sx(
                  styles.segment,
                  repeatType === id && styles.segmentActive,
                  { flexDirection: 'row', gap: 6, justifyContent: 'center' }
                )}
              >
                <Icon size={16} color={repeatType === id ? '#2563eb' : '#475569'} />
                <Text style={sx(
                  styles.segmentText,
                  repeatType === id && { color: '#2563eb' }
                )}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Danh mục */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <View style={styles.wrapRow}>
            {categories.map(cat => {
              const active = selectedCategories.includes(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={sx(
                    styles.chip,
                    { borderColor: active ? cat.color : '#e5e7eb',
                      backgroundColor: active ? '#00000008' : '#fff' }
                  )}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text numberOfLines={1} style={styles.chipText}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Nhắc nhở */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Nhắc nhở</Text>
          <Pressable style={styles.remindBtn}>
            <Text style={styles.remindLeft}>Tạo nhắc nhở mới</Text>
            <Text style={styles.remindArrow}>→</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <Link href="/(tabs)/habits/AddHabitModal" asChild>
          <Pressable style={sx(styles.bottomBtn, { backgroundColor: '#f1f5f9' })}>
            <Text style={sx(styles.bottomText, { color: '#475569' })}>Hủy</Text>
          </Pressable>
        </Link>
        <Pressable
          disabled={invalidRange}
          style={sx(
            styles.bottomBtn,
            { flex: 2, backgroundColor: invalidRange ? '#94a3b8' : '#2563eb' }
          )}
          onPress={() => {
            // TODO: gọi API tạo thói quen
            // router.replace('/(tabs)/habits');
          }}
        >
          <Text style={sx(styles.bottomText, { color: '#fff' })}>Tạo thói quen</Text>
        </Pressable>
      </View>

      {/* Confirm delete */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmOpen(false)}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Xóa thói quen "{habitName}"?</Text>
            <Text style={styles.small}>Hành động này không thể hoàn tác.</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.btnCancel} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.btnDanger}
                onPress={() => { setConfirmOpen(false); /* TODO: delete */ }}
              >
                <Text style={styles.btnDangerText}>Xóa</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef2ff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    margin: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconGhost: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffffcc', borderWidth: 1, borderColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  small: { fontSize: 12, color: '#64748b' },

  section: { padding: 14, marginHorizontal: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },

  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, backgroundColor: '#fff',
  },

  label: { fontSize: 10, color: '#64748b', fontWeight: '700', marginBottom: 4, marginLeft: 6 },
  webInputWrapper: {
    overflow: 'hidden',
  },
  datePill: {
    height: 36, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#fff', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  error: { color: '#dc2626', fontSize: 11, marginTop: 6, fontWeight: '700' },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCell: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  colorDot: {
    width: 34, height: 34, borderRadius: 17, borderColor: '#d1d5db',
  },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb', borderWidth: 2 },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  chip: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0f172a', maxWidth: 120 },

  remindBtn: {
    width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  remindLeft: { fontSize: 14, color: '#475569' },
  remindArrow: { fontSize: 14, color: '#475569', fontWeight: '700' },

  bottomBar: {
    padding: 12, flexDirection: 'row', gap: 8,
  },
  bottomBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  bottomText: { fontSize: 14, fontWeight: '800' },

  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center', justifyContent: 'center'
  },
  menu: {
    width: 200, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden'
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 12 },
  menuText: { fontSize: 13, color: '#0f172a' },

  confirmCard: {
    width: '92%', maxWidth: 420, backgroundColor: '#fff',
    borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#e5e7eb',
  },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  confirmRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 },
  btnCancel: { backgroundColor: '#e5e7eb', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  btnCancelText: { color: '#0f172a', fontWeight: '800' },
  btnDanger: { backgroundColor: '#ef4444', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  btnDangerText: { color: '#fff', fontWeight: '800' },
});