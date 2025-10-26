// app/(tabs)/habits/index.tsx  (web-safe: no array styles reach DOM/SVG)
import React, { useMemo, useState } from 'react';
import { Stack, Link, router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import {
  Home, TrendingUp, Moon, Users, User, Plus, BarChart3, ChevronLeft,
  Check, X, Minus, MoreVertical,
  AlignJustify
} from '@tamagui/lucide-icons';

// Helper: flatten mọi style mảng -> object (an toàn cho web/DOM/SVG)
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  RNStyleSheet.flatten(styles.filter(Boolean));

type Habit = {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500';
  duration: string;
};

export default function FlowStateHabits() {
  const [chartView, setChartView] = useState<'day'|'week'|'month'>('day');
  const [habitStatus, setHabitStatus] = useState<Record<number, 'success'|'fail'|'skip'|undefined>>({});
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const initialHabits: Habit[] = useMemo(() => ([
    { id: 1, title: 'Thiền 10 phút', subtitle: 'Thiền chính niệm buổi sáng', tag: 'Mindful', tagColor: 'bg-green-500', duration: '12 ngày' },
    { id: 2, title: 'Đi bộ 30 phút', subtitle: 'Đi bộ ngoài trời hoặc treadmill', tag: 'Energy', tagColor: 'bg-orange-500', duration: '8 ngày' },
    { id: 3, title: 'Ngủ đúng giờ', subtitle: 'Đi ngủ trước 23:00', tag: 'Sleep', tagColor: 'bg-blue-500', duration: '16 ngày' },
    { id: 4, title: 'Đọc sách 20 phút', subtitle: 'Đọc sách phát triển bản thân', tag: 'Mindful', tagColor: 'bg-green-500', duration: '5 ngày' },
    { id: 5, title: 'Uống 2L nước', subtitle: 'Uống đủ nước mỗi ngày', tag: 'Energy', tagColor: 'bg-orange-500', duration: '20 ngày' },
    { id: 6, title: 'Viết nhật ký', subtitle: 'Ghi lại suy nghĩ cuối ngày', tag: 'Mindful', tagColor: 'bg-green-500', duration: '3 ngày' }
  ]), []);
  const [habitList, setHabitList] = useState<Habit[]>(initialHabits);

  // Modal chỉnh sửa
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editTag, setEditTag] = useState('');

  // Modal xác nhận xóa
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const openEditModal = (h: Habit) => {
    setEditId(h.id);
    setEditTitle(h.title);
    setEditSubtitle(h.subtitle);
    setEditTag(h.tag);
    setEditOpen(true);
  };
  const closeEditModal = () => {
    setEditOpen(false);
    setEditId(null);
    setEditTitle('');
    setEditSubtitle('');
    setEditTag('');
  };

  const askDelete = (id: number, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmId(null);
    setConfirmName('');
  };

  const saveEdit = () => {
    if (editId == null) return;
    setHabitList(list =>
      list.map(h =>
        h.id === editId ? { ...h, title: editTitle.trim() || h.title, subtitle: editSubtitle, tag: editTag } : h
      )
    );
    closeEditModal();
    // router.push('/(tabs)/habits/CreateHabitDetail');
  };

  const deleteHabit = (id: number) => {
    setHabitList(list => list.filter(h => h.id !== id));
    setHabitStatus(({[id]: _, ...rest}) => rest);
    setNotes(({[id]: __, ...rest}) => rest);
    if (activeMenu === id) setActiveMenu(null);
    closeConfirm();
    if (editOpen) closeEditModal();
  };

  const getChartData = () => {
    if (chartView === 'day') {
      return [
        { day: 'T2', height: 60 }, { day: 'T3', height: 75 }, { day: 'T4', height: 80 },
        { day: 'T5', height: 55 }, { day: 'T6', height: 90 }, { day: 'T7', height: 70 }, { day: 'CN', height: 65 }
      ];
    } else if (chartView === 'week') {
      return [
        { day: 'Tuần 1', height: 65 }, { day: 'Tuần 2', height: 75 },
        { day: 'Tuần 3', height: 85 }, { day: 'Tuần 4', height: 95 }
      ];
    } else {
      return [
        { day: 'T1', height: 50 }, { day: 'T2', height: 65 }, { day: 'T3', height: 70 }, { day: 'T4', height: 80 },
        { day: 'T5', height: 60 }, { day: 'T6', height: 75 }, { day: 'T7', height: 55 }, { day: 'T8', height: 90 },
        { day: 'T9', height: 70 }, { day: 'T10', height: 85 }, { day: 'T11', height: 65 }, { day: 'T12', height: 95 }
      ];
    }
  };

  const handleStatusChange = (id: number, status: 'success'|'fail'|'skip') => {
    setHabitStatus(prev => ({
      ...prev,
      [id]: prev[id] === status ? undefined : status
    }));
  };

  const getStatusStyle = (status?: 'success'|'fail'|'skip'): { bg: string; border: string } => {
    if (status === 'success') return { bg: '#10b981', border: '#10b981' };
    if (status === 'fail')    return { bg: '#ef4444', border: '#ef4444' };
    if (status === 'skip')    return { bg: '#94a3b8', border: '#94a3b8' };
    return { bg: '#ffffff', border: '#d1d5db' };
  };

  const renderStatusIcon = (status?: 'success'|'fail'|'skip') => {
    if (status === 'success') return <Check size={18} color="#fff" />;
    if (status === 'fail')    return <X size={18} color="#fff" />;
    if (status === 'skip')    return <Minus size={18} color="#fff" />;
    return null;
  };

  const totalHabits = habitList.length;
  const completedCount = useMemo(
    () => habitList.filter(h => habitStatus[h.id] === 'success').length,
    [habitList, habitStatus]
  );
  const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={sx(styles.card, styles.header)}>
        <View style={styles.headerLeft}>
          <Pressable style={sx(styles.iconBtn, { backgroundColor: '#2563eb' })}>
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
          <View>
            <Text style={styles.title}>Flow State Habits</Text>
            <Text style={styles.subtitle}>Theo dõi thói quen hằng ngày</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Link href="/(tabs)/habits/AddHabitModal" asChild>
            <Pressable style={sx(styles.iconBtn, { backgroundColor: '#2563eb' })}>
              <Plus size={20} color="#fff" />
            </Pressable>
          </Link>
          <Link href="/(tabs)/habits/HabitStreak" asChild>
            <Pressable style={sx(styles.iconBtn, { backgroundColor: '#E5E7EB' })}>
              <BarChart3 size={20} color="#0f172a" />
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>

        {/* Progress Summary */}
        <View style={sx(styles.card, { padding: 16, marginHorizontal: 10, marginTop: 8 })}>
          <View style={styles.rowBetween}>
            <View style={styles.pill}>
              <TrendingUp size={16} color="#4338ca" />
              <Text style={styles.pillText}>Tiến độ hôm nay</Text>
            </View>
            <Text style={styles.smallStrong}>{completedCount}/{totalHabits} hoàn thành</Text>
          </View>

          <View style={styles.progressRail}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>

          <View style={sx(styles.rowBetween, { marginTop: 8 })}>
            <Text style={styles.muted}>Mục tiêu: hoàn thành tất cả</Text>
            <Text style={styles.percent}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={sx(styles.card, { padding: 16, marginHorizontal: 10, marginTop: 12 })}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Biểu đồ tiến bộ</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['day','week','month'] as const).map(v => (
                <Pressable
                  key={v}
                  onPress={() => setChartView(v)}
                  style={sx(
                    styles.switchBtn,
                    chartView === v ? styles.switchActive : styles.switchIdle
                  )}
                >
                  <Text style={sx(styles.switchText, chartView === v && { color: '#fff' })}>
                    {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {chartView !== 'month' ? (
            <View style={styles.chartRow}>
              {getChartData().map((item, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={[styles.bar, { height: item.height }]} />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.monthGrid}>
              {getChartData().map((item, i) => (
                <View key={i} style={styles.monthCell}>
                  <View style={[styles.bar, { height: item.height, width: 26 }]} />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Habits List */}
        <View style={sx(styles.card, { padding: 16, marginHorizontal: 10, marginTop: 12 })}>
          <Text style={styles.sectionTitle}>Danh sách thói quen</Text>

          {habitList.map((habit) => {
            const status = habitStatus[habit.id];
            const bgTag =
              habit.tagColor === 'bg-green-500' ? '#10b981' :
              habit.tagColor === 'bg-orange-500' ? '#f97316' : '#3b82f6';

            const s = getStatusStyle(status);

            return (
              <View key={habit.id} style={{ marginBottom: 10 }}>
                <Pressable
                  onPress={() => setActiveMenu(activeMenu === habit.id ? null : habit.id)}
                  style={sx(
                    styles.habitItem,
                    status === 'success'
                      ? { backgroundColor: '#f0fdf4' }
                      : status === 'fail'
                      ? { backgroundColor: '#fef2f2' }
                      : { backgroundColor: '#ffffff' }
                  )}
                >
                  <View
                    style={sx(
                      styles.statusDot,
                      { backgroundColor: s.bg, borderColor: s.border }
                    )}
                  >
                    {renderStatusIcon(status)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text numberOfLines={1} style={styles.habitTitle}>{habit.title}</Text>
                      <View style={sx(styles.tag, { backgroundColor: bgTag })}>
                        <Text style={styles.tagText}>{habit.tag}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.habitSubtitle}>{habit.subtitle}</Text>
                  </View>

                  <Text style={styles.durationText}>{habit.duration}</Text>

                  <Pressable
                    onPress={(e) => { e.stopPropagation?.(); openEditModal(habit); }}
                    style={styles.dotBtn}
                  >
                    <MoreVertical size={18} color="#0f172a" />
                  </Pressable>
                </Pressable>

                {activeMenu === habit.id && (
                  <View style={styles.miniMenu}>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(habit.id, 'success')}
                        style={sx(styles.actionBtn, { backgroundColor: '#10b981' })}
                      >
                        <Text style={styles.actionText}>Hoàn thành</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(habit.id, 'fail')}
                        style={sx(styles.actionBtn, { backgroundColor: '#ef4444' })}
                      >
                        <Text style={styles.actionText}>Thất bại</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(habit.id, 'skip')}
                        style={sx(styles.actionBtn, styles.skipBtn)}
                      >
                        <Text style={sx(styles.actionText, { color: '#334155' })}>Bỏ qua</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.helperNote}>
                      * Bỏ qua: trung lập cho ngày hôm nay, <Text style={{ fontWeight: 'bold' }}>không cộng cũng không trừ</Text> vào tiến độ.
                    </Text>

                    <TextInput
                      placeholder="Ghi chú..."
                      value={notes[habit.id] || ''}
                      onChangeText={(t) => setNotes({ ...notes, [habit.id]: t })}
                      style={styles.noteInput}
                      multiline
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      

      {/* MODAL chỉnh sửa */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={(e)=>e.stopPropagation()}>
            <Text style={styles.modalTitle}>Chỉnh sửa thói quen</Text>

            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Tên thói quen"
            />
            <TextInput
              style={styles.modalInput}
              value={editSubtitle}
              onChangeText={setEditSubtitle}
              placeholder="Mô tả / ghi chú"
            />
            <TextInput
              style={styles.modalInput}
              value={editTag}
              onChangeText={setEditTag}
              placeholder="Tag (Mindful, Energy, ...)"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={()=> editId!=null && askDelete(editId, editTitle || '')}>
                <Text style={styles.linkDanger}>Xóa</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.btnGhost} onPress={closeEditModal}>
                  <Text style={styles.btnGhostText}>Hủy</Text>
                </TouchableOpacity>
                 <TouchableOpacity
  style={styles.btnPrimary}
  onPress={() => {
    setEditOpen(false);             // đóng modal chỉnh sửa
    router.replace('/(tabs)/habits/CreateHabitDetail'); // chuyển trang ngay sau đó
  }}
>
  <Text style={styles.btnPrimaryText}>Chỉnh sửa</Text>


                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL xác nhận xóa */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={closeConfirm}>
        <Pressable style={styles.modalOverlay} onPress={closeConfirm}>
          <Pressable style={sx(styles.modalCard, { padding: 22 })} onPress={(e)=>e.stopPropagation()}>
            <Text style={styles.confirmTitle}>Xóa thói quen “{confirmName}”?</Text>
            <Text style={styles.confirmSub}>Hành động này không thể hoàn tác.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={closeConfirm}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={()=> confirmId!=null && deleteHabit(confirmId!)}>
                <Text style={styles.btnDangerText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF2FF' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.6)',
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },

  header: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  title: { fontSize: 18, fontWeight: '800', letterSpacing: 0.2, color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallStrong: { fontSize: 13, color: '#334155', fontWeight: '700' },

  progressRail: {
    width: '100%', height: 10, borderRadius: 999, overflow: 'hidden',
    backgroundColor: '#e5e7eb', marginTop: 6,
  },
  progressBar: { height: '100%', backgroundColor: '#22c55e', borderRadius: 999 },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(99,102,241,.25)'
  },
  pillText: { color: '#4338ca', fontWeight: '700', fontSize: 12 },

  percent: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  muted: { fontSize: 12, color: '#64748b' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#0f172a' },

  switchBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(99,102,241,.15)',
  },
  switchActive: { backgroundColor: '#2563eb' },
  switchIdle: { backgroundColor: '#e2e8f0' },
  switchText: { fontSize: 12, fontWeight: '700', color: '#334155' },

  chartRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 140, gap: 8, paddingVertical: 6,
  },
  chartCol: { alignItems: 'center', minWidth: 36, gap: 6 },
  bar: {
    width: 28, borderRadius: 8,
    backgroundColor: '#4ade80',
  },
  barLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'row', alignItems: 'flex-end', justifyContent: 'space-between' ,height: 160, paddingVertical: 6 },
  monthCell: { width: '8.3%', alignItems: 'center', gap: 6 },

  habitItem: {
    borderWidth: 1, borderColor: 'rgba(203,213,225,.4)', borderRadius: 14,
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  statusDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  habitTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flexShrink: 1 },
  habitSubtitle: { fontSize: 13, color: '#64748b' },
  durationText: { fontSize: 12, color: '#64748b', fontWeight: '600', marginRight: 8 },

  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: '#fff', fontWeight: '700', fontSize: 11 },

  dotBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(203,213,225,.7)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  miniMenu: { marginTop: 8, marginLeft: 46, borderWidth: 1, borderColor: 'rgba(203,213,225,.5)', borderRadius: 12, padding: 10, backgroundColor: '#fff' },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  skipBtn: { backgroundColor: '#e5e7eb', borderWidth: 2, borderStyle: 'dashed', borderColor: '#94a3b8' },

  helperNote: { fontSize: 11, color: '#64748b', marginBottom: 8 },

  noteInput: {
    borderWidth: 1, borderColor: 'rgba(203,213,225,.9)', borderRadius: 10,
    backgroundColor: '#fff', padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top'
  },

  bottomNav: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderTopWidth: 1, borderTopColor: 'rgba(203,213,225,.6)',
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12,
  },
  navBtn: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    width: '92%', maxWidth: 440, backgroundColor: '#fff',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(203,213,225,.6)',
    padding: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  modalInput: {
    width: '100%', paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12,
    fontSize: 14, backgroundColor: '#fff', marginBottom: 10,
  },
  modalActions: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkDanger: { color: '#dc2626', fontWeight: '700' },
  btnGhost: { backgroundColor: '#e2e8f0', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  btnGhostText: { fontWeight: '700', color: '#0f172a' },
  btnPrimary: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },

  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  confirmSub: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  confirmActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  btnCancel: { backgroundColor: '#e5e7eb', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  btnCancelText: { color: '#0f172a', fontWeight: '700' },
  btnDanger: { backgroundColor: '#ef4444', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  btnDangerText: { color: '#fff', fontWeight: '700' },
});
