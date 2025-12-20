// app/(tabs)/habits/RunningHabitTracker.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Animated } from 'react-native';
import {
  Plus,
  Bell,
  Target,
  Edit2,
  Trash2,
  Award,
  Flame,
  TrendingUp,
  ChevronLeft,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import {
  getHabitReminders,
  createHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  getHabitStats,
} from '../../../server/habits';

// ✅ GOALS: dùng đúng service server/goals.js
import {
  getHabitGoals,
  createHabitGoal,
  updateHabitGoal,
  deleteHabitGoal,
  completeHabitGoal,
} from '../../../server/goals';
import Notification from './ToastMessage';

type Reminder = {
  id: string;
  time: string;
  days: boolean[];
  enabled: boolean;
  note?: string;
};

type GoalType =
  | 'total_completions'
  | 'streak'
  | 'weekly_target'
  | 'monthly_target'
  | 'custom';

type Challenge = {
  id: string;

  // ✅ API fields (đầy đủ theo testcases)
  type: GoalType;
  target: number;
  current: number;
  unit: string;
  description: string;
  deadline?: string; // YYYY-MM-DD
  reward?: string;
  isCompleted: boolean;
  progress: number; // 0..100
  remaining: number;
  createdAt?: string; // YYYY-MM-DD
  completedAt?: string; // YYYY-MM-DD

  // UI-only
  icon: string;
};

type HabitStats = {
  currentStreak: number;
  bestStreak: number;
  successRate: number; // %
};

const GOAL_EMOJIS = [
  '🎯','🔥','🏆','🥇','🥈','🥉','⭐','🌟','💫','🚩','🏁','⛳️','🎖️','🏅',
  '⛰️','🏔️','🚀','🧭','🗺️','🪜'
];

const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const GOAL_TYPES: Array<{ value: GoalType; label: string; defaultUnit: string }> = [
  { value: 'total_completions', label: 'Tổng lần', defaultUnit: 'lần' },
  { value: 'streak', label: 'Streak', defaultUnit: 'ngày' },
  { value: 'weekly_target', label: 'Tuần', defaultUnit: 'lần/tuần' },
  { value: 'monthly_target', label: 'Tháng', defaultUnit: 'lần/tháng' },
  { value: 'custom', label: 'Tuỳ chỉnh', defaultUnit: 'đơn vị' },
];

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const ModalSheet: React.FC<ModalSheetProps> = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
        </View>
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const toDateOnly = (iso?: string) => {
  if (!iso) return '';
  if (typeof iso === 'string' && iso.length >= 10) return iso.slice(0, 10);
  return '';
};

// ====== TIME/DATE HELPERS ======
const pad2 = (n: number) => String(n).padStart(2, '0');

const dateToHHMM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const hhmmToDate = (hhmm?: string) => {
  const now = new Date();
  const s = (hhmm || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return now;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10) || 0));
  const mi = Math.max(0, Math.min(59, parseInt(m[2], 10) || 0));
  const d = new Date(now);
  d.setHours(h, mi, 0, 0);
  return d;
};

const dateToYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const ymdToDate = (ymd?: string) => {
  const now = new Date();
  const s = (ymd || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return now;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const da = parseInt(m[3], 10);
  const d = new Date(y, mo, da, 12, 0, 0, 0);
  return isNaN(d.getTime()) ? now : d;
};

const isValidDateInput = (s: string) => {
  const t = (s || '').trim();
  if (!t) return true; // optional
  return /^\d{4}-\d{2}-\d{2}$/.test(t);
};

// ====== PICKER COMPONENTS (MOBILE) ======
const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
});

function TimePickerField({
  value,
  onChange,
  placeholder = '07:00',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState<number>(() => {
    if (!value) return 7;
    const [h] = value.split(':').map((x) => parseInt(x, 10));
    return Number.isFinite(h) ? h : 7;
  });
  const [minute, setMinute] = useState<number>(() => {
    if (!value) return 0;
    const parts = value.split(':');
    const m = parseInt(parts[1] || '0', 10);
    return Number.isFinite(m) ? m : 0;
  });

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const openPicker = () => {
    if (value) {
      const [h, m] = value.split(':').map((x) => parseInt(x, 10));
      if (Number.isFinite(h)) setHour(h);
      if (Number.isFinite(m)) setMinute(m);
    }
    setOpen(true);
  };

  const handleSave = () => {
    onChange(`${pad2(hour)}:${pad2(minute)}`);
    setOpen(false);
  };

  const adjustHour = (delta: number) => {
    setHour((prev) => {
      let newHour = prev + delta;
      if (newHour < 0) newHour = 23;
      if (newHour > 23) newHour = 0;
      return newHour;
    });
  };

  const adjustMinute = (delta: number) => {
    setMinute((prev) => {
      let newMin = prev + delta;
      if (newMin < 0) newMin = 59;
      if (newMin > 59) newMin = 0;
      return newMin;
    });
  };

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.inputPickerBtn}>
        <Bell size={16} color={value ? '#8b5cf6' : '#94a3b8'} />
        <Text style={{ 
          color: value ? '#0f172a' : '#94a3b8', 
          fontWeight: '800',
          marginLeft: 8,
          fontSize: 16
        }}>
          {value || placeholder}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={timePickerStyles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={timePickerStyles.card} onPress={(e) => e.stopPropagation()}>
            <View style={timePickerStyles.header}>
              <Bell size={24} color="#8b5cf6" />
              <Text style={timePickerStyles.title}>Chọn thời gian nhắc nhở</Text>
            </View>
            
            <View style={timePickerStyles.pickerContainer}>
              {/* Hour Picker */}
              <View style={timePickerStyles.timeColumn}>
                <TouchableOpacity 
                  onPress={() => adjustHour(1)} 
                  style={[timePickerStyles.arrowButton, timePickerStyles.arrowButtonUp]}
                  activeOpacity={0.7}
                >
                  <Text style={timePickerStyles.arrowText}>+</Text>
                </TouchableOpacity>
                
                <View style={timePickerStyles.timeDisplay}>
                  <Text style={timePickerStyles.timeText}>{pad2(hour)}</Text>
                  <View style={timePickerStyles.timeUnderline} />
                </View>
                
                <TouchableOpacity 
                  onPress={() => adjustHour(-1)} 
                  style={[timePickerStyles.arrowButton, timePickerStyles.arrowButtonDown]}
                  activeOpacity={0.7}
                >
                  <Text style={timePickerStyles.arrowText}>-</Text>
                </TouchableOpacity>
                
                <Text style={timePickerStyles.label}>Giờ</Text>
              </View>

              <View style={timePickerStyles.separatorContainer}>
                <Text style={timePickerStyles.separator}>:</Text>
                <View style={timePickerStyles.separatorDots}>
                  <View style={timePickerStyles.dot} />
                  <View style={timePickerStyles.dot} />
                </View>
              </View>

              {/* Minute Picker */}
              <View style={timePickerStyles.timeColumn}>
                <TouchableOpacity 
                  onPress={() => adjustMinute(1)} 
                  style={[timePickerStyles.arrowButton, timePickerStyles.arrowButtonUp]}
                  activeOpacity={0.7}
                >
                  <Text style={timePickerStyles.arrowText}>+</Text>
                </TouchableOpacity>
                
                <View style={timePickerStyles.timeDisplay}>
                  <Text style={timePickerStyles.timeText}>{pad2(minute)}</Text>
                  <View style={timePickerStyles.timeUnderline} />
                </View>
                
                <TouchableOpacity 
                  onPress={() => adjustMinute(-1)} 
                  style={[timePickerStyles.arrowButton, timePickerStyles.arrowButtonDown]}
                  activeOpacity={0.7}
                >
                  <Text style={timePickerStyles.arrowText}>-</Text>
                </TouchableOpacity>
                
                <Text style={timePickerStyles.label}>Phút</Text>
              </View>
            </View>

            {/* Quick Time Buttons */}
            <View style={timePickerStyles.quickButtons}>
              <TouchableOpacity
                onPress={() => {
                  setHour(6);
                  setMinute(0);
                }}
                style={timePickerStyles.quickBtn}
              >
                <Text style={timePickerStyles.quickBtnText}>06:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(7);
                  setMinute(0);
                }}
                style={timePickerStyles.quickBtn}
              >
                <Text style={timePickerStyles.quickBtnText}>07:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(12);
                  setMinute(0);
                }}
                style={timePickerStyles.quickBtn}
              >
                <Text style={timePickerStyles.quickBtnText}>12:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(18);
                  setMinute(0);
                }}
                style={timePickerStyles.quickBtn}
              >
                <Text style={timePickerStyles.quickBtnText}>18:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(21);
                  setMinute(0);
                }}
                style={timePickerStyles.quickBtn}
              >
                <Text style={timePickerStyles.quickBtnText}>21:00</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={timePickerStyles.btnRow}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.btnOutline}
              >
                <Text style={styles.btnOutlineText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.btnSolid, styles.btnSolidViolet]}
              >
                <Text style={styles.btnSolidText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DatePickerField({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => ymdToDate(value));

  const openPicker = () => {
    const base = ymdToDate(value);

    // ✅ ANDROID: calendar dialog luôn
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'date',
        display: 'calendar',
        onChange: (_event, selected) => {
          if (selected) onChange(dateToYMD(selected));
        },
      });
      return;
    }

    // ✅ IOS: hiển thị lịch inline
    setTemp(base);
    setOpen(true);
  };

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.inputPickerBtn}>
        <Text style={{ color: value ? '#0f172a' : '#94a3b8', fontWeight: '800' }}>
          {value || placeholder}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={pickerStyles.overlay}>
            <View style={pickerStyles.card}>
              <DateTimePicker
                value={temp}
                mode="date"
                // iOS: inline = lịch
                display="inline"
                onChange={(_e, selected) => selected && setTemp(selected)}
              />

              <View style={pickerStyles.btnRow}>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.btnOutline}>
                  <Text style={styles.btnOutlineText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onChange(dateToYMD(temp));
                    setOpen(false);
                  }}
                  style={[styles.btnSolid, styles.btnSolidPink]}
                >
                  <Text style={styles.btnSolidText}>Chọn</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const HabitTracker: React.FC = () => {
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();

  const [activeTab, setActiveTab] = useState<'info' | 'reminders' | 'goals'>('info');

  // ====== STATE ======
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStats>({
    currentStreak: 7,
    bestStreak: 45,
    successRate: 85,
  });

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Reminder>({
    id: Date.now().toString(),
    time: '07:00',
    days: [false, false, false, false, false, false, false],
    enabled: true,
    note: '',
  });

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');

  // ====== LOADING & NOTIFICATION STATE ======
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'warning';
  }>({
    visible: false,
    message: '',
    type: 'error'
  });
  const slideAnim = useState(new Animated.Value(Dimensions.get('window').width))[0];

  // ✅ GOAL MODAL STATE (đầy đủ field)
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Challenge | null>(null);

  const [newGoal, setNewGoal] = useState<Challenge>({
    id: Date.now().toString(),
    type: 'streak',
    target: 30,
    current: 0,
    unit: 'ngày',
    description: '',
    deadline: '',
    reward: '',
    isCompleted: false,
    progress: 0,
    remaining: 30,
    createdAt: '',
    completedAt: '',
    icon: '🎯',
  });

  // Custom confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // ====== HELPERS MAP API → UI ======
  const normalizeReminder = (r: any): Reminder => {
    const id = String(r.id ?? r._id ?? Date.now());
    const timeRaw: string = r.time ?? r.remindAt ?? '07:00';
    const time = timeRaw.slice(0, 5); // HH:MM

    let days: boolean[] = [false, false, false, false, false, false, false];
    const rawDays = r.days ?? r.daysOfWeek;
    if (Array.isArray(rawDays)) {
      if (rawDays.length === 7 && typeof rawDays[0] === 'boolean') {
        days = rawDays;
      } else if (rawDays.length && typeof rawDays[0] === 'number') {
        days = days.map((_, i) => {
          const dayNumber = i === 6 ? 0 : i + 1; // API: 0 = CN, 1 = T2, ...
          return rawDays.includes(dayNumber);
        });
      }
    }

    const enabled: boolean =
      r.enabled ?? r.isActive ?? r.soundEnabled ?? r.vibrationEnabled ?? true;
    const note: string = r.note ?? r.description ?? r.message ?? '';

    return { id, time, days, enabled, note };
  };

  const normalizeGoal = (g: any): Challenge => {
    const id = String(g.id ?? g._id ?? Date.now());

    const type: GoalType = (g.type ?? 'streak') as GoalType;

    const target = Number(g.target ?? 0) || 0;
    const current = Number(g.current ?? 0) || 0;

    const unit =
      String(g.unit ?? '').trim() ||
      (GOAL_TYPES.find(x => x.value === type)?.defaultUnit ?? 'lần');

    const description = String(g.description ?? '').trim();
    const deadline = toDateOnly(g.deadline);
    const reward = String(g.reward ?? '').trim();

    const isCompleted = Boolean(g.isCompleted ?? false);

    const progressFromApi = Number(g.progress);
    const progress =
      Number.isFinite(progressFromApi)
        ? clamp(progressFromApi, 0, 100)
        : (target > 0 ? clamp((current / target) * 100, 0, 100) : 0);

    const remainingFromApi = Number(g.remaining);
    const remaining =
      Number.isFinite(remainingFromApi)
        ? Math.max(remainingFromApi, 0)
        : Math.max(target - current, 0);

    const createdAt = toDateOnly(g.createdAt);
    const completedAt = toDateOnly(g.completedAt);

    const icon = g.icon ?? '🎯';

    return {
      id,
      type,
      target,
      current,
      unit,
      description,
      deadline,
      reward,
      isCompleted,
      progress,
      remaining,
      createdAt,
      completedAt,
      icon,
    };
  };

  const extractGoalsArray = (res: any): any[] => {
    if (Array.isArray(res?.goals)) return res.goals;
    if (Array.isArray(res?.data?.goals)) return res.data.goals;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  };

  // ====== LOAD DATA TỪ API ======
  useEffect(() => {
    if (!habitId) return;

    let cancelled = false;

    const loadReminders = async () => {
      try {
        const res: any = await getHabitReminders(habitId as string);
        const list: any[] = res?.reminders ?? res?.data ?? res ?? [];
        if (!cancelled) setReminders(list.map(normalizeReminder));
      } catch (e) {
        console.error('[HabitTracker] getHabitReminders error:', e);
        if (!cancelled) showNotification('Không thể tải danh sách nhắc nhở', 'error');
      }
    };

    const loadGoals = async () => {
      try {
        const res: any = await getHabitGoals(habitId as string, null);
        const arr = extractGoalsArray(res);
        if (!cancelled) setChallenges(arr.map(normalizeGoal));
      } catch (e) {
        console.error('[HabitTracker] getHabitGoals error:', e);
        if (!cancelled) showNotification('Không thể tải danh sách mục tiêu', 'error');
      }
    };

    const loadStats = async () => {
      try {
        const res: any = await getHabitStats(habitId as string, {});
        const habit = res?.data?.habit ?? res?.habit;
        const statsRoot = res?.data ?? res ?? {};
        const s = statsRoot.stats ?? statsRoot;

        const habitName = habit?.name ?? '';
        const freqRaw = habit?.frequency ?? '';

        const freqLabel = (() => {
          switch (freqRaw) {
            case 'daily':
              return 'HÀNG NGÀY';
            case 'weekly':
              return 'HÀNG TUẦN';
            case 'monthly':
              return 'HÀNG THÁNG';
            default:
              return 'HÀNG NGÀY';
          }
        })();

        if (!cancelled) {
          setName(habitName);
          setFrequency(freqLabel);
        }

        const completed = Number(s?.completedCount ?? s?.completed ?? 0) || 0;
        const failed = Number(s?.failedCount ?? s?.failed ?? 0) || 0;
        const skipped = Number(s?.skippedCount ?? s?.skipped ?? 0) || 0;
        const total =
          Number(s?.totalCount ?? s?.total ?? completed + failed + skipped) || 0;

        const streaks = statsRoot.streaks ?? {};
        const currentStreak = Number(streaks.current ?? statsRoot.currentStreak ?? 0) || 0;
        const bestStreak =
          Number(streaks.best ?? statsRoot.longestStreak ?? currentStreak) || 0;

        let successRate = 0;
        if (Number.isFinite(statsRoot.successRate)) successRate = Number(statsRoot.successRate);
        else if (total > 0) successRate = (completed / total) * 100;

        if (!cancelled) {
          setHabitStats({
            currentStreak,
            bestStreak,
            successRate: Math.round(successRate),
          });
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitStats error:', e);
        if (!cancelled) showNotification('Không thể tải thống kê thói quen', 'error');
      }
    };

    loadReminders();
    loadGoals();
    loadStats();

    return () => {
      cancelled = true;
    };
  }, [habitId]);

  const refetchAll = useCallback(async () => {
    if (!habitId) {
      console.log('⚠️ No habitId, skipping refetch');
      return;
    }
    
    console.log('🔄 Starting refetchAll for habitId:', habitId);
    setIsRefreshing(true);
    
    try {
      const [r, g, s]: any[] = await Promise.all([
        getHabitReminders(habitId as string),
        getHabitGoals(habitId as string, null),
        getHabitStats(habitId as string, {}),
      ]);

      const rlist: any[] = r?.reminders ?? r?.data ?? r ?? [];
      setReminders(rlist.map(normalizeReminder));

      const glist = extractGoalsArray(g);
      setChallenges(glist.map(normalizeGoal));

      const statsRoot = s?.data ?? s ?? {};
      const habit = statsRoot.habit;
      if (habit) {
        const freqLabel = (() => {
          switch (habit.frequency) {
            case 'daily':
              return 'HÀNG NGÀY';
            case 'weekly':
              return 'HÀNG TUẦN';
            case 'monthly':
              return 'HÀNG THÁNG';
            default:
              return 'HÀNG NGÀY';
          }
        })();
        setName(habit.name ?? '');
        setFrequency(freqLabel);
      }

      const stats = statsRoot.stats ?? statsRoot;
      const completed = Number(stats?.completedCount ?? stats?.completed ?? 0) || 0;
      const failed = Number(stats?.failedCount ?? stats?.failed ?? 0) || 0;
      const skipped = Number(stats?.skippedCount ?? stats?.skipped ?? 0) || 0;
      const total =
        Number(stats?.totalCount ?? stats?.total ?? completed + failed + skipped) || 0;

      const streaks = statsRoot.streaks ?? {};
      const currentStreak = Number(streaks.current ?? statsRoot.currentStreak ?? 0) || 0;
      const bestStreak =
        Number(streaks.best ?? statsRoot.longestStreak ?? currentStreak) || 0;

      let successRate = 0;
      if (Number.isFinite(statsRoot.successRate)) successRate = Number(statsRoot.successRate);
      else if (total > 0) successRate = (completed / total) * 100;

      setHabitStats({ currentStreak, bestStreak, successRate: Math.round(successRate) });
      
      console.log('✅ RefetchAll completed successfully:', {
        reminders: rlist.length,
        goals: glist.length,
        habitName: name,
        stats: { currentStreak, bestStreak, successRate: Math.round(successRate) }
      });
      
    } catch (e) {
      console.error('❌ RefetchAll error:', e);
      showNotification('Không thể tải dữ liệu. Vui lòng thử lại.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [habitId]);

  // ====== RELOAD API KHI CHUYỂN TAB (FOCUS EFFECT) ======
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 RunningHabitTracker focused - reloading all APIs...');
      
      if (habitId) {
        // Reload tất cả API khi màn hình được focus
        refetchAll().then(() => {
          console.log('✅ All APIs reloaded successfully');
        }).catch((error) => {
          console.error('❌ Error reloading APIs:', error);
        });
      }
    }, [habitId, refetchAll])
  );

  // ====== UPDATE FIELD LOCAL ======
  const updateReminderField = useCallback((field: keyof Reminder, value: any) => {
    setNewReminder(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateGoalField = useCallback((field: keyof Challenge, value: any) => {
    setNewGoal(prev => ({ ...prev, [field]: value }));
  }, []);

  // ====== CUSTOM NOTIFICATION FUNCTIONS ======
  const showNotification = useCallback((message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setNotification({ visible: true, message, type });
    
    // Slide in from right
    slideAnim.setValue(Dimensions.get('window').width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
  }, [slideAnim]);

  const hideNotification = useCallback(() => {
    // Slide out to right
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    });
  }, [slideAnim]);

  const openConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const buildReminderPayload = (reminder: Reminder) => {
    const dayNumbers = Array.isArray(reminder.days)
      ? reminder.days.reduce<number[]>((acc, active, idx) => {
          if (active) acc.push(idx === 6 ? 0 : idx + 1);
          return acc;
        }, [])
      : [];

    const time = (reminder.time || '').slice(0, 5) || '07:00';
    const message =
      reminder.note && reminder.note.trim().length > 0 ? reminder.note : 'đến giờ';

    return {
      time,
      days: dayNumbers,
      soundEnabled: reminder.enabled,
      message,
      vibrationEnabled: reminder.enabled,
    };
  };

  // ====== SAVE / DELETE REMINDER (API) ======
  const resetReminderForm = () => {
    setEditingReminder(null);
    setNewReminder({
      id: Date.now().toString(),
      time: '07:00',
      days: [false, false, false, false, false, false, false],
      enabled: true,
      note: '',
    });
  };

  const handleSaveReminder = async () => {
    try {
      // Kiểm tra xem có ít nhất 1 ngày được chọn không
      const hasSelectedDays = newReminder.days.some(day => day === true);
      
      if (!hasSelectedDays) {
        showNotification('Vui lòng chọn ít nhất 1 ngày trong tuần để nhận thông báo.', 'warning');
        return; // Không gọi API
      }

      console.log('✅ Validation passed, creating reminder...');
      const payload: any = buildReminderPayload(newReminder);
      
      console.log('📤 Reminder payload:', payload);

      if (habitId) {
        if (editingReminder) {
          await updateHabitReminder(habitId as string, editingReminder.id, payload);
          await refetchAll();
        } else {
          await createHabitReminder(habitId as string, payload);
          await refetchAll();
        }
      } else {
        if (editingReminder) {
          setReminders(prev =>
            prev.map(r => (r.id === editingReminder.id ? { ...newReminder } : r)),
          );
        } else {
          setReminders(prev => [...prev, { ...newReminder, id: Date.now().toString() }]);
        }
      }
      
      console.log('✅ Reminder saved successfully');
      showNotification('Nhắc nhở đã được lưu thành công!', 'success');
      
    } catch (e) {
      console.error('[HabitTracker] saveReminder error:', e);
      showNotification('Không thể lưu nhắc nhở. Vui lòng thử lại.', 'error');
    } finally {
      setShowReminderModal(false);
      resetReminderForm();
    }
  };

  const toggleReminderEnabled = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const updated = { ...target, enabled: !target.enabled };
    setReminders(prev => prev.map(r => (r.id === id ? updated : r)));

    if (habitId) {
      try {
        const payload: any = buildReminderPayload(updated);
        await updateHabitReminder(habitId as string, id, payload);
        await refetchAll();
        showNotification('Đã cập nhật trạng thái nhắc nhở', 'success');
      } catch (e) {
        console.error('[HabitTracker] toggleReminderEnabled error:', e);
        showNotification('Không thể cập nhật trạng thái nhắc nhở', 'error');
      }
    }
  };

  // ====== GOALS PAYLOADS ======
  const buildCreateGoalPayload = (g: Challenge) => {
    const target = Math.max(1, Number(g.target) || 1);
    const payload: any = {
      type: g.type,
      target,
    };

    const unit = (g.unit || '').trim();
    if (unit) payload.unit = unit;

    const desc = (g.description || '').trim();
    if (desc) payload.description = desc;

    const deadline = (g.deadline || '').trim();
    if (deadline && isValidDateInput(deadline)) payload.deadline = deadline;

    const reward = (g.reward || '').trim();
    if (reward) payload.reward = reward;

    return payload;
  };

  const buildUpdateGoalPayload = (g: Challenge) => {
    const payload: any = {};

    if (Number.isFinite(Number(g.target))) payload.target = Math.max(1, Number(g.target) || 1);
    if (Number.isFinite(Number(g.current))) payload.current = Math.max(0, Number(g.current) || 0);

    payload.description = (g.description || '').trim();
    payload.reward = (g.reward || '').trim();

    const unit = (g.unit || '').trim();
    if (unit) payload.unit = unit;

    const deadline = (g.deadline || '').trim();
    if (deadline === '') payload.deadline = null;
    else if (isValidDateInput(deadline)) payload.deadline = deadline;

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  };

  // ====== SAVE / DELETE / COMPLETE GOAL (API) ======
  const resetGoalForm = () => {
    setEditingGoal(null);
    setNewGoal({
      id: Date.now().toString(),
      type: 'streak',
      target: 30,
      current: 0,
      unit: 'ngày',
      description: '',
      deadline: '',
      reward: '',
      isCompleted: false,
      progress: 0,
      remaining: 30,
      createdAt: '',
      completedAt: '',
      icon: '🎯',
    });
  };

  const handleSaveGoal = async () => {
    try {
      if (!isValidDateInput(newGoal.deadline || '')) {
        console.error('[HabitTracker] invalid deadline format. Use YYYY-MM-DD');
        return;
      }

      if (!habitId) {
        if (editingGoal) {
          setChallenges(prev => prev.map(c => (c.id === editingGoal.id ? { ...newGoal } : c)));
        } else {
          setChallenges(prev => [...prev, { ...newGoal, id: Date.now().toString() }]);
        }
        setShowGoalModal(false);
        resetGoalForm();
        return;
      }

      const isUpdate = !!editingGoal;

      if (isUpdate) {
        const payload = buildUpdateGoalPayload(newGoal);
        await updateHabitGoal(habitId as string, editingGoal!.id, payload);
        await refetchAll();
        showNotification('Mục tiêu đã được cập nhật thành công!', 'success');
      } else {
        const payload = buildCreateGoalPayload(newGoal);
        await createHabitGoal(habitId as string, payload);
        await refetchAll();
        showNotification('Mục tiêu mới đã được tạo thành công!', 'success');
      }
    } catch (e) {
      console.error('[HabitTracker] saveGoal error:', e);
      showNotification('Không thể lưu mục tiêu. Vui lòng thử lại.', 'error');
    } finally {
      setShowGoalModal(false);
      resetGoalForm();
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!habitId) return;
    try {
      await completeHabitGoal(habitId as string, goalId);
      await refetchAll();
      showNotification('🎉 Chúc mừng! Mục tiêu đã hoàn thành!', 'success');
    } catch (e) {
      console.error('[HabitTracker] completeGoal error:', e);
      showNotification('Không thể đánh dấu hoàn thành mục tiêu. Vui lòng thử lại.', 'error');
    }
  };

  // ====== UI COMPONENTS ======
  const StatCards: React.FC<{ stats: HabitStats }> = ({ stats }) => (
    <View style={styles.statCards}>
      <View style={[styles.statCard, styles.statCardRose]}>
        <View style={[styles.statCardCircle, styles.statCardCircleRose]} />
        <Flame size={24} color="#f43f5e" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{stats.currentStreak}</Text>
        <Text style={styles.statSub}>Streak hiện tại</Text>
      </View>
      <View style={[styles.statCard, styles.statCardAmber]}>
        <View style={[styles.statCardCircle, styles.statCardCircleAmber]} />
        <Award size={24} color="#d97706" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{stats.bestStreak}</Text>
        <Text style={styles.statSub}>Kỷ lục cao nhất</Text>
      </View>
      <View style={[styles.statCard, styles.statCardTeal]}>
        <View style={[styles.statCardCircle, styles.statCardCircleTeal]} />
        <TrendingUp size={24} color="#0d9488" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{Math.round(stats.successRate)}%</Text>
        <Text style={styles.statSub}>Tỷ lệ thành công</Text>
      </View>
    </View>
  );

  const ReminderList = () => (
    <View style={styles.list}>
      {reminders.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardLeft}>
              <LinearGradient
                colors={r.enabled ? ['#7c3aed', '#6d28d9'] : ['#cbd5e1', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <Bell color="#fff" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <View>
                <Text style={styles.timeText}>{r.time}</Text>
                <Text style={[styles.statusText, r.enabled ? styles.statusOn : styles.statusOff]}>
                  {r.enabled ? 'Đang hoạt động' : 'Đã tạm dừng'}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingReminder(r);
                  setNewReminder(r);
                  setShowReminderModal(true);
                }}
                style={[styles.iconAction, styles.iconActionEdit]}
              >
                <Edit2 color="#8b5cf6" size={16} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  openConfirm('Bạn có chắc muốn xóa nhắc nhở này?', async () => {
                    if (habitId) {
                      try {
                        await deleteHabitReminder(habitId as string, r.id);
                        await refetchAll();
                        showNotification('Nhắc nhở đã được xóa thành công!', 'success');
                      } catch (e) {
                        console.error('[HabitTracker] deleteReminder error:', e);
                        showNotification('Không thể xóa nhắc nhở. Vui lòng thử lại.', 'error');
                      }
                    } else {
                      await refetchAll();
                      showNotification('Nhắc nhở đã được xóa thành công!', 'success');
                    }
                  })
                }
                style={[styles.iconAction, styles.iconActionDelete]}
              >
                <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View>
              <Text style={styles.sectionLabel}>Lặp lại theo ngày</Text>
              <View style={styles.dayRow}>
                {r.days.map((a, i) => (
                  <View key={i} style={[styles.dayPill, a && styles.dayPillActive]}>
                    <Text style={[styles.dayPillText, a && styles.dayPillTextActive]}>
                      {dayNames[i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {!!r.note && r.note.trim().length > 0 && (
              <View>
                <Text style={styles.goalNote}>{r.note}</Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.sectionLabel}>Trạng thái thông báo</Text>
              <Pressable
                onPress={() => toggleReminderEnabled(r.id)}
                style={[styles.toggle, r.enabled && styles.toggleOn]}
              >
                <View style={[styles.toggleKnob, r.enabled && styles.toggleKnobOn]}>
                  {r.enabled && <Check size={14} color="#7c3aed" strokeWidth={3} />}
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const GoalTypeBadge: React.FC<{ type: GoalType; completed: boolean }> = ({ type, completed }) => {
    const label = GOAL_TYPES.find(x => x.value === type)?.label ?? type;
    return (
      <View style={[styles.badge, completed ? styles.badgeDone : styles.badgeActive]}>
        <Text style={[styles.badgeText, completed ? styles.badgeTextDone : styles.badgeTextActive]}>
          {completed ? `✅ ${label}` : `⏳ ${label}`}
        </Text>
      </View>
    );
  };

  const GoalList = () => (
    <View style={styles.list}>
      {challenges.map((c) => {
        const progress = Number.isFinite(c.progress)
          ? clamp(c.progress, 0, 100)
          : (c.target > 0 ? clamp((c.current / c.target) * 100, 0, 100) : 0);

        const subtitleParts = [
          c.unit ? `Đơn vị: ${c.unit}` : '',
          c.deadline ? `Hạn: ${c.deadline}` : '',
          c.createdAt ? `Tạo: ${c.createdAt}` : '',
          c.completedAt ? `Xong: ${c.completedAt}` : '',
        ].filter(Boolean);

        return (
          <View key={c.id} style={[styles.card, styles.goalCard]}>
            <View style={styles.cardHead}>
              <View style={styles.cardLeft}>
                <Text style={styles.emoji}>{c.icon}</Text>
                <View style={{ flexShrink: 1 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text style={styles.goalTitle}>{c.description || 'Mục tiêu'}</Text>
                    <GoalTypeBadge type={c.type} completed={c.isCompleted} />
                  </View>

                  

                  
                </View>
              </View>

              <View style={styles.cardActions}>
                {!c.isCompleted && (
                  <TouchableOpacity
                    onPress={() =>
                      openConfirm('Đánh dấu mục tiêu này là hoàn thành?', async () => {
                        await handleCompleteGoal(c.id);
                      })
                    }
                    style={[styles.iconAction, styles.iconActionEdit]}
                  >
                    <Check color="#16a34a" size={18} strokeWidth={3} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setEditingGoal(c);
                    setNewGoal(c);
                    setShowGoalModal(true);
                  }}
                  style={[styles.iconAction, styles.iconActionEdit]}
                >
                  <Edit2 color="#d946ef" size={16} strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    openConfirm('Bạn có muốn xóa mục tiêu này?', async () => {
                      if (habitId) {
                        try {
                          await deleteHabitGoal(habitId as string, c.id);
                          await refetchAll();
                          showNotification('Mục tiêu đã được xóa thành công!', 'success');
                          return;
                        } catch (e) {
                          console.error('[HabitTracker] deleteGoal error:', e);
                          showNotification('Không thể xóa mục tiêu. Vui lòng thử lại.', 'error');
                          return;
                        }
                      }
                      setChallenges(prev => prev.filter(x => x.id !== c.id));
                      showNotification('Mục tiêu đã được xóa thành công!', 'success');
                    })
                  }
                  style={[styles.iconAction, styles.iconActionDelete]}
                >
                  <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.progressHead}>
                <Text style={styles.sectionLabel}>Tiến độ hoàn thành</Text>
                <Text style={styles.progressPercent}>{Math.round(c.isCompleted?100:progress)}%</Text>
              </View>

              <View style={styles.progressBar}>
                <LinearGradient
                  colors={c.isCompleted ? ['#16a34a', '#22c55e', '#4ade80'] : ['#d946ef', '#ec4899', '#f43f5e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${c.isCompleted?100:progress}%` }]}
                />
              </View>

              <View style={styles.progressFoot}>
                <Text style={styles.goalCompleted}>
                  {c.isCompleted ? 'Đã hoàn thành' : 'Còn lại'}
                </Text>
                <Text style={styles.goalCount}>
                  <Text style={styles.accent}>{c.isCompleted?c.target:c.current}</Text> / {c.target} {c.unit || ''}
                  {!c.isCompleted && (
                    <Text style={{ color: '#64748b', fontWeight: '700' }}>
                      {'  '}({c.remaining} còn lại)
                    </Text>
                  )}
                </Text>
              </View>
              {
                !c.isCompleted && (
                  <View>
                { c.type !== "total_completions" &&
                (<Text style={styles.goalMeta}>Duy trì {c.target} {c.unit} liên tục</Text>)
                }
                { c.type == "total_completions" &&
                (<Text style={styles.goalMeta}>Hoàn thành {c.target} {c.unit} liên tục</Text>)
                }
                {c.deadline != null && (
                    <Text style={styles.goalMeta}>Hạn {c.deadline}</Text>
                  )}
                  {!!c.reward && c.reward.trim().length > 0 && (
                    <Text style={styles.goalNote}>🎁 {c.reward}</Text>
                  )}
              </View>
                )
              }
              
            </View>
          </View>
        );
      })}
    </View>
  );

  // ====== UI ======
  const goalTypeSelected = useMemo(() => {
    return GOAL_TYPES.find(x => x.value === newGoal.type) ?? GOAL_TYPES[1];
  }, [newGoal.type]);

  return (
    <SafeAreaView style={styles.page}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarInner}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/habits')} style={styles.backBtn}>
              <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
            </TouchableOpacity>

            <LinearGradient
              colors={['#7c3aed', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appBadge}
            >
              <Target color="#fff" size={22} strokeWidth={2.5} />
            </LinearGradient>

            <View>
              <Text style={styles.appTitle}>FlowState</Text>
              <Text style={styles.appSubtitle}>Habit Tracking System</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['info', 'reminders', 'goals'] as const).map((t) => {
              const isActive = activeTab === t;
              const label = t === 'info' ? 'Tổng quan' : t === 'reminders' ? 'Nhắc nhở' : 'Mục tiêu';
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveTab(t)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {activeTab === 'info' && (
          <>
            <Text style={styles.sectionTitle}>Tổng quan</Text>

            <LinearGradient
              colors={['#7c3aed', '#9333ea', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View>
                <Text style={styles.heroEyebrow}>THÓI QUEN {frequency}</Text>
                <Text style={styles.heroTitle}>{name}</Text>
                <Text style={styles.heroSubtitle}>Gieo nhịp từng bước - Kỷ luật {frequency}</Text>

                <View style={styles.heroStats}>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatLabel}>Tần suất</Text>
                    <Text style={styles.heroStatValue}>{frequency}</Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatLabel}>Mục tiêu</Text>
                    <Text style={styles.heroStatValue}>{name}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <StatCards stats={habitStats} />
          </>
        )}

        {activeTab === 'reminders' && (
          <>
            <View style={styles.sectionHead}>
              <TouchableOpacity onPress={() => setActiveTab('info')} style={styles.backInlineBtn}>
                <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
                <Text style={styles.backInlineText}>Quay lại</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Nhắc nhở</Text>

              <TouchableOpacity
                onPress={() => {
                  setEditingReminder(null);
                  resetReminderForm();
                  setShowReminderModal(true);
                }}
                style={[styles.iconBtn, styles.iconBtnViolet]}
              >
                <Plus size={20} strokeWidth={2.5} color="#fff" />
              </TouchableOpacity>
            </View>

            <ReminderList />
          </>
        )}

        {activeTab === 'goals' && (
          <>
            <View style={styles.sectionHead}>
              <TouchableOpacity onPress={() => setActiveTab('info')} style={styles.backInlineBtn}>
                <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
                <Text style={styles.backInlineText}>Quay lại</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Mục tiêu</Text>

              <TouchableOpacity
                onPress={() => {
                  setEditingGoal(null);
                  resetGoalForm();
                  setShowGoalModal(true);
                }}
                style={[styles.iconBtn, styles.iconBtnPink]}
              >
                <Plus size={20} strokeWidth={2.5} color="#fff" />
              </TouchableOpacity>
            </View>

            {challenges.length === 0 ? (
              <Text style={{ color: '#64748b', fontWeight: '700' }}>
                Chưa có mục tiêu nào (hoặc chưa load được goals).
              </Text>
            ) : (
              <GoalList />
            )}
          </>
        )}
      </ScrollView>

      {/* Reminder Modal */}
      <ModalSheet
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setEditingReminder(null);
        }}
        title={editingReminder ? 'Chỉnh sửa nhắc nhở' : 'Thêm nhắc nhở mới'}
      >
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Thời gian</Text>

            {/* ✅ BẤM LÀ HIỆN TIME PICKER */}
            <TimePickerField
              value={newReminder.time}
              onChange={(t) => updateReminderField('time', t)}
              placeholder="07:00"
            />
          </View>

          <View>
            <Text style={styles.label}>Lặp lại theo ngày</Text>
            <View style={styles.dayGrid}>
              {dayNames.map((d, i) => {
                const active = newReminder.days[i];
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      const ds = [...newReminder.days];
                      ds[i] = !ds[i];
                      updateReminderField('days', ds);
                    }}
                    style={[styles.daySquare, active && styles.daySquareActive]}
                  >
                    <Text style={[styles.daySquareText, active && styles.daySquareTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Hint text */}
            <Text style={{
              fontSize: 12,
              color: newReminder.days.some(day => day === true) ? '#10b981' : '#ef4444',
              marginTop: 6,
              fontWeight: '600'
            }}>
              {newReminder.days.some(day => day === true) 
                ? '✓ Đã chọn ngày nhắc nhở' 
                : '⚠️ Vui lòng chọn ít nhất 1 ngày'}
            </Text>
          </View>

          <View>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              value={newReminder.note || ''}
              onChangeText={(text) => updateReminderField('note', text)}
              style={styles.textarea}
              placeholder="Thêm ghi chú cho nhắc nhở..."
              multiline
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={() => {
                setShowReminderModal(false);
                setEditingReminder(null);
              }}
              style={styles.btnOutline}
            >
              <Text style={styles.btnOutlineText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSaveReminder} 
              style={[
                styles.btnSolid, 
                styles.btnSolidViolet,
                // Disabled style nếu chưa chọn ngày nào
                !newReminder.days.some(day => day === true) && {
                  backgroundColor: '#94a3b8',
                  opacity: 0.6
                }
              ]}
              disabled={!newReminder.days.some(day => day === true)}
            >
              <Text style={styles.btnSolidText}>Lưu lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* ✅ Goal Modal (FULL FIELDS) */}
      <ModalSheet
        visible={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
      >
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Mô tả (description)</Text>
            <TextInput
              value={newGoal.description}
              onChangeText={(text) => updateGoalField('description', text)}
              style={styles.input}
              placeholder="VD: Duy trì streak 30 ngày"
            />
          </View>

          <View>
            <Text style={styles.label}>Loại mục tiêu (type)</Text>
            <View style={styles.typeRow}>
              {GOAL_TYPES.map((t) => {
                const active = newGoal.type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => {
                      updateGoalField('type', t.value);
                      const currentUnit = (newGoal.unit || '').trim();
                      if (!currentUnit || currentUnit === goalTypeSelected.defaultUnit) {
                        updateGoalField('unit', t.defaultUnit);
                      }
                    }}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Biểu tượng</Text>
            <View style={styles.emojiGrid}>
              {GOAL_EMOJIS.map((emo) => {
                const isSelected = newGoal.icon === emo;
                return (
                  <TouchableOpacity
                    key={emo}
                    style={[styles.emojiCell, isSelected && styles.emojiCellSelected]}
                    onPress={() => updateGoalField('icon', emo)}
                  >
                    <Text style={styles.emojiCellText}>{emo}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGrid}>
            <View>
              <Text style={styles.label}>Target</Text>
              <TextInput
                value={String(newGoal.target)}
                onChangeText={(text) => updateGoalField('target', parseInt(text || '0', 10) || 0)}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
            <View>
              <Text style={styles.label}>Current</Text>
              <TextInput
                value={String(newGoal.current)}
                onChangeText={(text) => updateGoalField('current', parseInt(text || '0', 10) || 0)}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                value={newGoal.unit}
                onChangeText={(text) => updateGoalField('unit', text)}
                style={styles.input}
                placeholder="VD: lần / ngày / lần/tuần"
              />
            </View>

            <View>
              <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>

              {/* ✅ BẤM LÀ HIỆN LỊCH */}
              <DatePickerField
                value={newGoal.deadline || ''}
                onChange={(d) => updateGoalField('deadline', d)}
                placeholder="2025-01-31"
              />
            </View>
          </View>

          <View>
            <Text style={styles.label}>Reward (reward)</Text>
            <TextInput
              value={newGoal.reward || ''}
              onChangeText={(text) => updateGoalField('reward', text)}
              style={styles.textarea}
              placeholder="VD: Mua sách mới"
              multiline
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={() => {
                setShowGoalModal(false);
                setEditingGoal(null);
              }}
              style={styles.btnOutline}
            >
              <Text style={styles.btnOutlineText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveGoal} style={[styles.btnSolid, styles.btnSolidPink]}>
              <Text style={styles.btnSolidText}>Lưu lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* Confirm Modal */}
      <ModalSheet
        visible={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        title="Xác nhận"
      >
        <View style={styles.form}>
          <Text style={styles.confirmMessage}>{confirmMessage}</Text>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => {
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              <Text style={styles.btnOutlineText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSolid, styles.btnSolidPink]}
              onPress={() => {
                if (confirmAction) confirmAction();
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              <Text style={styles.btnSolidText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* Custom Notification */}
      {notification.visible && (
        <Animated.View
          style={[
            notificationStyles.container,
            notificationStyles[notification.type],
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={notificationStyles.content}>
            <View style={notificationStyles.iconContainer}>
              <Text style={notificationStyles.icon}>
                {notification.type === 'error' ? '❌' : 
                 notification.type === 'success' ? '✅' : '⚠️'}
              </Text>
            </View>
            <Text style={notificationStyles.message}>{notification.message}</Text>
            <TouchableOpacity
              onPress={hideNotification}
              style={notificationStyles.closeButton}
            >
              <Text style={notificationStyles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default HabitTracker;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },

  /* Topbar */
  topbar: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 40,
  },
  topbarInner: { paddingHorizontal: 20, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  backBtn: { marginRight: 8, padding: 6, borderRadius: 999 },
  appBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  appSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    borderRadius: 16,
    padding: 6,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: { fontSize: 14, fontWeight: '800', color: '#475569' },
  tabTextActive: { color: '#fff' },

  /* Content */
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },

  /* Hero */
  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 5,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: '#E9D5FF', fontSize: 14, marginBottom: 16 },
  heroStats: { flexDirection: 'row', gap: 12 },
  heroStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroStatLabel: { color: '#DDD6FE', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  heroStatValue: { color: '#fff', fontSize: 18, fontWeight: '800' },

  /* Stat cards */
  statCards: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardRose: { backgroundColor: '#fff0f4', borderColor: 'rgba(251,113,133,0.4)' },
  statCardAmber: { backgroundColor: '#fff7ed', borderColor: 'rgba(251,191,36,0.4)' },
  statCardTeal: { backgroundColor: '#ecfeff', borderColor: 'rgba(45,212,191,0.4)' },
  statCardCircle: { position: 'absolute', width: 80, height: 80, borderRadius: 40, top: -16, right: -16 },
  statCardCircleRose: { backgroundColor: 'rgba(251,113,133,0.08)' },
  statCardCircleAmber: { backgroundColor: 'rgba(245,158,11,0.08)' },
  statCardCircleTeal: { backgroundColor: 'rgba(13,148,136,0.08)' },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statSub: { fontSize: 12, fontWeight: '600', color: 'rgba(71,85,105,0.8)' },

  /* List & cards */
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  goalCard: {},
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statusText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusOn: { color: '#7c3aed' },
  statusOff: { color: '#94a3b8' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconAction: { padding: 8, borderRadius: 10 },
  iconActionEdit: { backgroundColor: 'transparent' },
  iconActionDelete: { backgroundColor: 'transparent' },
  cardBody: { gap: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 6 },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayPillText: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  dayPillTextActive: { color: '#fff' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },

  /* Toggle */
  toggle: { width: 56, height: 28, borderRadius: 999, backgroundColor: '#cbd5e1', padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#7c3aed' },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },

  /* Goals */
  emoji: { fontSize: 32 },
  goalTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2, flexShrink: 1 },
  goalNote: { fontSize: 14, fontWeight: '600', color: '#111827' },
  goalMeta: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 2 },

  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPercent: { fontWeight: '800', fontSize: 13, color: '#ec4899' },
  progressBar: { height: 10, borderRadius: 999, backgroundColor: '#f1f5f9', overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 999 },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  goalCompleted: { fontSize: 12, color: '#64748b' },
  goalCount: { fontSize: 12, fontWeight: '800', color: '#111827' },
  accent: { color: '#d946ef' },

  /* Badges */
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeActive: { backgroundColor: '#fff7ed', borderColor: 'rgba(245,158,11,0.35)' },
  badgeDone: { backgroundColor: '#ecfdf5', borderColor: 'rgba(34,197,94,0.35)' },
  badgeText: { fontSize: 12, fontWeight: '900' },
  badgeTextActive: { color: '#b45309' },
  badgeTextDone: { color: '#15803d' },

  /* Section head */
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backInlineText: { color: '#475569', fontWeight: '600' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtnViolet: { backgroundColor: '#7c3aed' },
  iconBtnPink: { backgroundColor: '#d946ef' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  modalHeader: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalBody: { paddingHorizontal: 24, paddingVertical: 18 },
  confirmMessage: { fontSize: 16, color: '#334155', marginBottom: 12 },

  /* Form */
  form: { gap: 16 },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8 },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  textarea: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontWeight: '600',
    minHeight: 90,
    textAlignVertical: 'top',
    color: '#0f172a',
  },
  formGrid: { flexDirection: 'row', gap: 12 },
  formActions: { flexDirection: 'row', gap: 12, paddingTop: 12 },
  btnOutline: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontWeight: '800', color: '#334155' },
  btnSolid: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnSolidViolet: { backgroundColor: '#7c3aed' },
  btnSolidPink: { backgroundColor: '#d946ef' },
  btnSolidText: { fontWeight: '800', color: '#fff' },

  /* ✅ Picker input button (thay cho TextInput thời gian/ngày) */
  inputPickerBtn: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Emoji grid */
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellSelected: {
    borderColor: '#d946ef',
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  emojiCellText: { fontSize: 22 },

  /* Day picker in modal */
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  daySquare: {
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySquareActive: { backgroundColor: '#7c3aed', borderColor: 'transparent' },
  daySquareText: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  daySquareTextActive: { color: '#fff' },

  /* Goal type chips */
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  typeChipText: { fontSize: 12, fontWeight: '900', color: '#475569' },
  typeChipTextActive: { color: '#fff' },
});

/* ========================================================= */
/* TIME PICKER STYLES                                        */
/* ========================================================= */

const timePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeColumn: {
    alignItems: 'center',
  },
  arrowButton: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 6,
    borderWidth: 1,
  },
  arrowButtonUp: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  arrowButtonDown: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  arrowText: {
    fontSize: 24,
    color: '#8b5cf6',
    fontWeight: '800',
  },
  timeDisplay: {
    width: 90,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#8b5cf6',
    marginVertical: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timeText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#8b5cf6',
    letterSpacing: -1,
  },
  timeUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
    marginTop: 4,
  },
  separatorContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  separator: {
    fontSize: 40,
    fontWeight: '900',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  separatorDots: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
});

/* ========================================================= */
/* CUSTOM NOTIFICATION STYLES                                */
/* ========================================================= */

const notificationStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    zIndex: 9999,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  error: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  success: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  warning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
  },
});
