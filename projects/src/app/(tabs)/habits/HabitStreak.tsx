// app/(tabs)/habits/HabitStreak.tsx
import React from 'react';
import { Stack, Link } from 'expo-router';
import {
  SafeAreaView, View, Text, ScrollView, StyleSheet, Pressable,
  TouchableOpacity, StyleProp, ViewStyle, TextStyle, ImageStyle
} from 'react-native';
import { ChevronLeft, Flame, Calendar, TrendingUp } from '@tamagui/lucide-icons';

// Helper: flatten mọi style mảng -> object (an toàn web/DOM/SVG)
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type Status = 'completed' | 'failed' | 'skipped' | 'none';

export default function HabitStreak() {
  const [selectedHabit, setSelectedHabit] = React.useState(1);
  const [currentDate, setCurrentDate] = React.useState(new Date(2025, 9, 17)); // 17/10/2025

  const habits = [
    {
      id: 1,
      title: 'Thiền 10 phút',
      tag: 'Mindful',
      tagColor: '#10b981',
      streak: 12,
      bestStreak: 25,
      stats: { completed: 24, failed: 3, skipped: 2, total: 29 },
      completedDates: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 17],
      failedDates: [6, 13, 16],
      skippedDates: [7, 14],
    },
    {
      id: 2,
      title: 'Đi bộ 30 phút',
      tag: 'Energy',
      tagColor: '#10b981',
      streak: 5,
      bestStreak: 18,
      stats: { completed: 18, failed: 5, skipped: 6, total: 29 },
      completedDates: [1, 2, 4, 5, 8, 10, 11, 12, 15, 16, 17],
      failedDates: [3, 6, 9, 13, 14],
      skippedDates: [7, 12, 18, 19, 20],
    },
    {
      id: 3,
      title: 'Ngủ đúng giờ',
      tag: 'Sleep',
      tagColor: '#10b981',
      streak: 20,
      bestStreak: 20,
      stats: { completed: 26, failed: 1, skipped: 2, total: 29 },
      completedDates: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17],
      failedDates: [14],
      skippedDates: [18, 19],
    },
  ];

  const habit = habits.find(h => h.id === selectedHabit)!;

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=CN

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const getStatusForDay = (day: number | null): Status => {
    if (!day) return 'none';
    if (habit.completedDates.includes(day)) return 'completed';
    if (habit.failedDates.includes(day)) return 'failed';
    if (habit.skippedDates.includes(day)) return 'skipped';
    return 'none';
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'completed': return habit.tagColor;
      case 'failed':    return '#ef4444';
      case 'skipped':   return '#f59e0b';
      default:          return '#f3f4f6';
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'failed':    return '✗';
      case 'skipped':   return '–';
      default:          return '';
    }
  };

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const dayNames   = ['CN','T2','T3','T4','T5','T6','T7'];

  const changeMonth = (delta: number) => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={sx(styles.card, styles.header)}>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={styles.iconBtn}>
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
        </Link>
        <View>
          <Text style={styles.headerTitle}>Chuỗi Thành Công</Text>
          <Text style={styles.headerSub}>Theo dõi chuỗi ngày liên tiếp</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Habit selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hSelector}
        >
          {habits.map(h => {
            const active = selectedHabit === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => setSelectedHabit(h.id)}
                style={sx(
                  styles.hChip,
                  { borderColor: active ? h.tagColor : '#e5e7eb',
                    backgroundColor: active ? '#00000008' : '#fff' }
                )}
              >
                <Text
                  style={sx(
                    styles.hChipText,
                    { color: active ? h.tagColor : '#6b7280' }
                  )}
                >
                  {h.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main streak */}
        <View style={sx(styles.card, styles.centerCard)}>
          <View style={styles.streakRow}>
            <Flame size={32} color={habit.tagColor} />
            <Text style={sx(styles.streakNumber, { color: habit.tagColor })}>{habit.streak}</Text>
          </View>
          <Text style={styles.streakLabel}>Chuỗi Hiện Tại</Text>
          <Text style={styles.muted}>Chuỗi tốt nhất: {habit.bestStreak} ngày</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Hoàn Thành</Text>
              <Text style={sx(styles.statValue, { color: '#10b981' })}>{habit.stats.completed}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Thất Bại</Text>
              <Text style={sx(styles.statValue, { color: '#ef4444' })}>{habit.stats.failed}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bỏ Qua</Text>
              <Text style={sx(styles.statValue, { color: '#f59e0b' })}>{habit.stats.skipped}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tổng</Text>
              <Text style={sx(styles.statValue, { color: '#6b7280' })}>{habit.stats.total}</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={sx(styles.card, styles.section)}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <Calendar size={16} color="#0f172a" />
              <Text style={styles.monthTitle}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
            </View>
            <View style={styles.rowCenter}>
              <Pressable style={styles.navBtn} onPress={() => changeMonth(-1)}>
                <Text style={styles.navBtnText}>←</Text>
              </Pressable>
              <Pressable style={styles.navBtn} onPress={() => changeMonth(1)}>
                <Text style={styles.navBtnText}>→</Text>
              </Pressable>
            </View>
          </View>

          {/* Day headers */}
          <View style={styles.weekRow}>
            {dayNames.map((d) => (
              <View key={d} style={styles.weekCell}>
                <Text style={styles.weekText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.gridWrap}>
            {calendarDays.map((day, idx) => {
              const status = getStatusForDay(day);
              const color = getStatusColor(status);
              const label = getStatusLabel(status);
              const isDay = !!day;

              return (
                <View key={idx} style={styles.dayCellWrap}>
                  <View
                    style={sx(
                      styles.dayCircle,
                      { backgroundColor: isDay ? color : 'transparent' },
                      isDay && status === 'none' && { backgroundColor: '#f3f4f6' }
                    )}
                  >
                    {isDay && (
                      <>
                        <Text
                          style={sx(
                            styles.dayLabel,
                            { color: status === 'none' ? '#6b7280' : '#fff' }
                          )}
                        >
                          {label}
                        </Text>
                        <Text
                          style={sx(
                            styles.dayNum,
                            { color: status === 'none' ? '#6b7280' : '#fff' }
                          )}
                        >
                          {day}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={sx(styles.legendText, { color: '#10b981' })}>✓ = Hoàn thành</Text>
            <Text style={sx(styles.legendText, { color: '#ef4444' })}>✗ = Thất bại</Text>
            <Text style={sx(styles.legendText, { color: '#f59e0b' })}>– = Bỏ qua</Text>
            <Text style={sx(styles.legendText, { color: '#6b7280' })}>Trắng = Chưa ghi nhận</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={sx(styles.card, styles.section)}>
          <View style={styles.rowCenter}>
            <TrendingUp size={16} color="#0f172a" />
            <Text style={styles.sumTitle}>Thống Kê Tổng</Text>
          </View>

          <View style={styles.twoGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tỷ Lệ Hoàn Thành</Text>
              <Text style={sx(styles.statValue, { color: '#10b981' })}>
                {Math.round((habit.stats.completed / habit.stats.total) * 100)}%
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tỷ Lệ Thất Bại</Text>
              <Text style={sx(styles.statValue, { color: '#ef4444' })}>
                {Math.round((habit.stats.failed / habit.stats.total) * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_PCT = '14.2857%';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    marginHorizontal: 12, marginTop: 8, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#9ca3af' },

  hSelector: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  hChip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, marginRight: 8,
  },
  hChipText: { fontSize: 13, fontWeight: '600' },

  centerCard: { marginHorizontal: 12, marginTop: 8, padding: 20, alignItems: 'center' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  streakNumber: { fontSize: 44, fontWeight: '800' },
  streakLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  muted: { fontSize: 13, color: '#6b7280', marginBottom: 14 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between',
    width: '100%',
  },
  statBox: {
    flexBasis: '48%',
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },

  section: { marginHorizontal: 12, marginTop: 8, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthTitle: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#0f172a' },

  navBtn: {
    width: 32, height: 32, borderRadius: 6,
    borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8, backgroundColor: '#fff',
  },
  navBtnText: { fontSize: 16, color: '#374151', fontWeight: '700' },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekCell: { width: CELL_PCT, alignItems: 'center', paddingVertical: 4 },
  weekText: { fontSize: 11, color: '#6b7280', fontWeight: '700' },

  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  dayCellWrap: { width: CELL_PCT, alignItems: 'center', marginVertical: 4 },
  dayCircle: {
    width: 40, aspectRatio: 1, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  dayLabel: { fontSize: 14, fontWeight: '800' },
  dayNum: { fontSize: 10, fontWeight: '700', marginTop: 1 },

  legend: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 10,
  },
  legendText: { fontSize: 12, fontWeight: '700', marginBottom: 4 },

  sumTitle: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  twoGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 10 },
});
