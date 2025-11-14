
import React, { useMemo, useState, useEffect } from 'react';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import {
  View, Text, SafeAreaView, ScrollView, StyleSheet,
  Pressable, TextInput, TouchableOpacity, Modal, Platform,
  StyleProp, ViewStyle, TextStyle, ImageStyle, Alert,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { X, ChevronLeft, Check, Plus } from '@tamagui/lucide-icons';
import {
  getHabitTemplateById,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../../../server/habits';

// Helper: flatten style mảng -> object
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type Freq = 'daily' | 'weekly' | 'custom';
type Repeat = 'everyday' | 'avoid';
type TrackingMode = 'check' | 'count';

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ------------------------------------------------------------------ */
/* Helpers đảm bảo không bao giờ gửi frequency nếu là custom          */
/* ------------------------------------------------------------------ */

// Loại bỏ key có giá trị undefined hoặc null (deep)
function deepStrip<T = any>(obj: T): T {
  if (Array.isArray(obj)) {
    // @ts-ignore
    return obj.map(deepStrip).filter(v => v !== undefined && v !== null) as any;
  }
  if (obj && typeof obj === 'object') {
    const out: any = {};
    Object.entries(obj as any).forEach(([k, v]) => {
      const vv = deepStrip(v);
      if (vv !== undefined && vv !== null) out[k] = vv;
    });
    return out;
  }
  return obj;
}

// Xoá cứng các key
function drop<T extends Record<string, any>>(obj: T, keys: string[]): T {
  const clone: any = { ...obj };
  for (const k of keys) delete clone[k];
  return clone;
}

// Trả về phần tần suất: nếu custom → CHỈ gửi customFrequency (+ targetCount nếu count)
// TUYỆT ĐỐI không kèm frequency khi custom
function buildFrequencyPart(
  frequency: Freq,
  customTimes: string,
  customPeriod: 'day' | 'week' | 'month',
  trackingMode: TrackingMode
) {
  if (frequency === 'custom') {
    const n = parseInt(customTimes || '0', 10);
    if (Number.isFinite(n) && n > 0) {
      const customObj = { times: n, period: customPeriod };
      return {
        customFrequency: customObj,
        ...(trackingMode === 'count' ? { targetCount: n } : {}),
      };
    }
    return {};
  }
  return { frequency };
}

// Bảo hiểm cuối: nếu đang có customFrequency/customFrequence → xoá frequency (nếu lỡ còn sót)
function sanitizeFrequency<T extends Record<string, any>>(payload: T): T {
  const hasCustom =
    !!(payload as any).customFrequency || !!(payload as any).customFrequence;
  return hasCustom ? drop(payload, ['frequency']) : payload;
}

export default function CreateHabitDetail() {
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const isEditMode = useMemo(
    () => !!templateId && templateId !== 'null' && templateId !== 'undefined',
    [templateId]
  );

  // State
  const [habitName, setHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [frequency, setFrequency] = useState<Freq>('daily');
  const [customTimes, setCustomTimes] = useState('1');
  const [customPeriod, setCustomPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [repeatType, setRepeatType] = useState<Repeat>('everyday');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('check');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dates
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const invalidRange = !!(endDate && endDate < startDate);

  const icons = useMemo(
    () => ['🍎','🏃','⏰','💝','📚','💻','📱','🧘','💰','😊','💤','⚡','🎯','📖','✏️','🏠','🎵','🍵','💧','🥬','🏥','👟','👥'],
    [],
  );
  const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1', '#EF4444', '#22C55E', '#FF6B35', '#8B5CF6', '#6B7280'];
  const frequencies = [
    { id: 'daily', label: 'Hàng ngày' },
    { id: 'weekly', label: 'Hàng tuần' },
    { id: 'custom', label: 'Tuỳ chỉnh' },
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

  // Auto set custom khi nhập số lần
  const onChangeCustomTimes = (v: string) => {
    setCustomTimes(v);
    if (frequency !== 'custom') setFrequency('custom');
  };

  // Build payload (Create & "Tạo từ mẫu" dùng chung)
  const buildPayload = () => {
    const primaryCategory = selectedCategories[0];
    const categorySlug = primaryCategory ? primaryCategory.toLowerCase() : undefined;
    const habitType = repeatType === 'avoid' ? 'quit' : 'build';

    const base: any = {
      name: habitName?.trim() || undefined,
      description: description?.trim() || undefined,
      icon: selectedIcon || undefined,
      color: selectedColor || undefined,
      category: categorySlug,
      habitType,
      trackingMode,
      startDate: fmtDate(startDate),
      ...(endDate ? { endDate: fmtDate(endDate) } : {}),
    };

    const freqPart = buildFrequencyPart(frequency, customTimes, customPeriod, trackingMode);
    let payload: any = sanitizeFrequency(deepStrip({ ...base, ...freqPart }));
    console.log('[CreateHabitDetail] payload:', payload);
    return payload;
  };

  const handleCreateNew = async () => {
    if (!habitName.trim()) {
      alert('Thiếu tên', 'Vui lòng nhập tên thói quen.');
      return;
    }
    if (invalidRange || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = buildPayload();
      const res = await createHabit(payload);
      console.log('[CreateHabitDetail] createHabit API:', res);
      alert('Thành công', 'Đã tạo thói quen mới.');
      setIsSubmitting(false);
      router.replace('/(tabs)/habits');
    } catch (err) {
      console.error('[CreateHabitDetail] createHabit error:', err);
      alert('Lỗi', 'Không thể tạo thói quen. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  // Load template / reset
  useEffect(() => {
    const resetForm = () => {
      setHabitName('');
      setDescription('');
      setSelectedIcon('');
      setSelectedColor('#10b981');
      setFrequency('daily');
      setCustomTimes('1');
      setCustomPeriod('day');
      setRepeatType('everyday');
      setSelectedCategories([]);
      setStartDate(new Date());
      setEndDate(null);
      setTrackingMode('check');
    };

    if (!isEditMode) {
      resetForm();
      return;
    }

    (async () => {
      try {
        const res: any = await getHabitTemplateById(templateId);
        const t = res?.template || res?.habitTemplate || res;
        if (!t) return resetForm();

        if (t.name) setHabitName(t.name);
        if (t.description) setDescription(t.description);
        if (t.icon) setSelectedIcon(t.icon);
        if (t.color) setSelectedColor(t.color);

        if (t.frequency === 'weekly') setFrequency('weekly');
        else if (t.frequency === 'custom') setFrequency('custom');
        else setFrequency('daily');

        const tmplCustom = t.customFrequency || t.customFrequence;
        if (tmplCustom) {
          const times = Number(tmplCustom.times || t.targetCount || 1);
          if (Number.isFinite(times) && times > 0) setCustomTimes(String(times));
          const period = tmplCustom.period;
          if (period === 'day' || period === 'week' || period === 'month') setCustomPeriod(period);
        } else if (t.targetCount) {
          setCustomTimes(String(t.targetCount));
        }

        if (t.habitType === 'quit') setRepeatType('avoid');
        else setRepeatType('everyday');

        if (t.trackingMode === 'count') setTrackingMode('count');
        else setTrackingMode('check');

        if (t.category) {
          const found = categories.find(
            (c) => c.id.toLowerCase() === String(t.category).toLowerCase()
          );
          setSelectedCategories([found ? found.id : String(t.category)]);
        }
      } catch (err) {
        console.error('[CreateHabitDetail] load template error:', err);
        resetForm();
      }
    })();
  }, [isEditMode, templateId]);

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Web date handler
  const handleWebDateChange = (which: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (which === 'start') {
      setStartDate(date);
      if (endDate && endDate < date) setEndDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      alert('Thiếu tên', 'Vui lòng nhập tên thói quen.');
      return;
    }
    if (invalidRange || isSubmitting) return;

    const payload = buildPayload();

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        const res = await updateHabit(templateId as string, payload);
        console.log('[CreateHabitDetail] updateHabit API:', res);
        alert('Thành công', 'Đã cập nhật thói quen.');
      } else {
        const res = await createHabit(payload);
        console.log('[CreateHabitDetail] createHabit API:', res);
      }
      router.replace('/(tabs)/habits');
    } catch (err) {
      console.error(`[CreateHabitDetail] ${isEditMode ? 'updateHabit' : 'createHabit'} error:`, err);
      alert('Lỗi', `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} thói quen. Vui lòng thử lại.`);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await deleteHabit(templateId as string);
      console.log('[CreateHabitDetail] deleteHabit API:', res);
      alert('Thành công', 'Đã xóa thói quen.');
      router.replace('/(tabs)/habits');
    } catch (err) {
      console.error('[CreateHabitDetail] deleteHabit error:', err);
      alert('Lỗi', 'Không thể xóa thói quen. Vui lòng thử lại.');
      setIsSubmitting(false);
    } finally {
      setConfirmOpen(false);
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
            <Text style={styles.title}>{isEditMode ? 'Sửa thói quen' : 'Chi tiết thói quen'}</Text>
            <Text style={sx(styles.small, { color: '#2563eb', fontWeight: '700' })}>Quay lại</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable 
            style={sx(styles.createBtn, { backgroundColor: '#10b981' })} 
            onPress={handleCreateNew}
            disabled={isSubmitting}
          >
            <Plus size={18} color="#fff" strokeWidth={3} />
            <Text style={styles.createBtnText}>Tạo mới</Text>
          </Pressable>
          <Link href="/(tabs)/habits" asChild>
            <Pressable style={styles.iconGhost}>
              <X size={18} color="#0f172a" />
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Tracking mode */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Chế độ theo dõi</Text>
          <View style={styles.segmentRow}>
            {(['check','count'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setTrackingMode(m)}
                style={sx(
                  styles.segment,
                  trackingMode === m && styles.segmentActive
                )}
              >
                <Text style={sx(styles.segmentText, trackingMode === m && { color: '#2563eb' })}>
                  {m === 'check' ? '✓ Check' : '# Count'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tên + mô tả */}
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

        {/* Thời gian */}
        <View style={sx(styles.card, styles.section)}>
          <Text style={styles.sectionTitle}>Thời gian</Text>

          {Platform.OS === 'web' ? (
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

          {invalidRange && <Text style={styles.error}>Ngày kết thúc phải ≥ ngày bắt đầu.</Text>}
        </View>

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
                  {
                    borderColor: selectedIcon === icon ? selectedColor : '#e5e7eb',
                    backgroundColor: selectedIcon === icon ? `${selectedColor}15` : '#fff',
                  }
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
                  { 
                    backgroundColor: c, 
                    borderWidth: selectedColor === c ? 3 : 1,
                    borderColor: selectedColor === c ? c : '#d1d5db',
                  }
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
                style={sx(styles.segment, frequency === f.id && styles.segmentActive)}
              >
                <Text style={sx(styles.segmentText, frequency === f.id && { color: '#2563eb' })}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {frequency === 'custom' && (
            <View style={{ gap: 8, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={sx(styles.input, { width: 88, height: 40, paddingVertical: 8, textAlign: 'center', fontWeight: '700' })}
                  value={customTimes}
                  onChangeText={onChangeCustomTimes}
                  keyboardType="number-pad"
                />
                <View style={[styles.segmentRow, { flex: 1 }]}>
                  {(['day', 'week', 'month'] as const).map(p => (
                    <Pressable
                      key={p}
                      onPress={() => setCustomPeriod(p)}
                      style={sx(styles.segment, customPeriod === p && styles.segmentActive)}
                    >
                      <Text style={sx(styles.segmentText, customPeriod === p && { color: '#2563eb' })}>
                        {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Text style={styles.small}>Số lần / chu kỳ</Text>
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
                <Text style={sx(styles.segmentText, repeatType === id && { color: '#2563eb' })}>
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
                    {
                      borderColor: active ? cat.color : '#e5e7eb',
                      backgroundColor: active ? `${cat.color}15` : '#fff',
                    }
                  )}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text numberOfLines={1} style={styles.chipText}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </View>
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
          disabled={invalidRange || isSubmitting}
          style={sx(styles.bottomBtn, { flex: 2, backgroundColor: invalidRange || isSubmitting ? '#94a3b8' : '#2563eb' })}
          onPress={handleSave}
        >
          <Text style={sx(styles.bottomText, { color: '#fff' })}>
            {isSubmitting ? (isEditMode ? 'Đang lưu...' : 'Đang tạo...') : (isEditMode ? 'Lưu thay đổi' : 'Tạo thói quen')}
          </Text>
        </Pressable>
        {isEditMode && (
          <Pressable
            disabled={isSubmitting}
            style={sx(styles.bottomBtn, { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' })}
            onPress={() => setConfirmOpen(true)}
          >
            <Text style={sx(styles.bottomText, { color: '#dc2626' })}>Xóa</Text>
          </Pressable>
        )}
      </View>

      {/* Confirm delete */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmOpen(false)}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Xóa thói quen "{habitName || 'này'}"?</Text>
            <Text style={styles.small}>Hành động này không thể hoàn tác.</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.btnCancel} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.btnDanger} onPress={handleDelete} disabled={isSubmitting}>
                <Text style={styles.btnDangerText}>{isSubmitting ? 'Đang xóa...' : 'Xóa'}</Text>
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
    margin: 12, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  iconGhost: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ffffffcc', 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  small: { fontSize: 12, color: '#64748b' },

  section: { padding: 14, marginHorizontal: 12, marginBottom: 12 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 10 
  },

  input: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    fontSize: 14, 
    backgroundColor: '#fff',
    color: '#0f172a',
  },

  label: { 
    fontSize: 10, 
    color: '#64748b', 
    fontWeight: '700', 
    marginBottom: 4, 
    marginLeft: 6 
  },
  webInputWrapper: { overflow: 'hidden' },
  datePill: {
    height: 36, 
    borderRadius: 999, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    backgroundColor: '#fff',
    paddingHorizontal: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#0f172a', 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 4, 
    elevation: 2,
  },
  dateText: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  error: { 
    color: '#dc2626', 
    fontSize: 11, 
    marginTop: 6, 
    fontWeight: '700' 
  },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCell: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  colorDot: { 
    width: 34, 
    height: 34, 
    borderRadius: 17,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  segmentActive: { 
    backgroundColor: '#eff6ff', 
    borderColor: '#2563eb', 
    borderWidth: 2,
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  chip: { 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    borderWidth: 2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#0f172a', 
    maxWidth: 120 
  },

  bottomBar: { 
    padding: 12, 
    flexDirection: 'row', 
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bottomText: { fontSize: 14, fontWeight: '800' },

  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15,23,42,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  confirmCard: { 
    width: '92%', 
    maxWidth: 420, 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    padding: 22, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  confirmTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 6 
  },
  confirmRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 12, 
    marginTop: 16 
  },
  btnCancel: { 
    backgroundColor: '#e5e7eb', 
    borderRadius: 999, 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  btnCancelText: { 
    color: '#0f172a', 
    fontWeight: '800',
    fontSize: 14,
  },
  btnDanger: { 
    backgroundColor: '#ef4444', 
    borderRadius: 999, 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  btnDangerText: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 14,
  },
});