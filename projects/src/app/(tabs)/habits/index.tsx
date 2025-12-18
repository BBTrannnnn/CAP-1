// app/(tabs)/habits/index.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  Check,
  X,
  Minus,
  MoreVertical,
  Plus,
  BarChart3,
  ChevronLeft,
  Clock,
  Target,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';

import {
  getHabits as apiGetHabits,
  trackHabit as apiTrackHabit,
  updateHabit as apiUpdateHabit,
  deleteHabit as apiDeleteHabit,
  // Count-mode APIs
  addSubTracking as apiAddHabitSubTracking,
  getSubTrackings as apiGetHabitSubTrackings,
  updateSubTracking as apiUpdateHabitSubTracking,
  deleteSubTracking as apiDeleteHabitSubTrackings,
  deleteTrackingDay as apiDeleteHabitTrackingDay,
  // Dashboard & Reports
  getTodayOverview as apiGetTodayOverview,
  getWeeklyReport as apiGetWeeklyReport,
  // tracking habit check-mode
  getHabitTrackings as apiGetHabitTrackings,
} from '../../../server/habits';

import { notifiToast } from '../../../server/runningTracker';

/* ========================================================= */
/* TYPES                                                     */
/* ========================================================= */

type Habit = {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500';
  duration: string;
  icon?: string; // emoji/icon từ BE
  color?: string; // màu chính từ BE (hex)
};

type CountEntry = {
  id: number;
  qty: number;
  note?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad';
  start?: string;
  end?: string;
  beId?: string;
};

type StatusUI = 'success' | 'fail' | 'skip' | 'in_progress';

type TaskStatus = 'completed' | 'in-progress' | 'pending';

interface HorizontalCalendarProps {
  onDateSelect?: (date: Date) => void;
  refreshToken?: number; // để refetch khi FE gọi lại API
}

type DayStatusMap = Record<string, TaskStatus>;

/* ========================================================= */
/* DATE HELPERS                                              */
/* ========================================================= */

const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const monthNames = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function startOfWeek(d: Date) {
  const dayOfWeek = d.getDay(); // 0..6 (CN..T7), CN là đầu tuần
  const weekStart = new Date(d);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(d.getDate() - dayOfWeek);
  return weekStart;
}

const formatDateYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function formatDateKey(d: Date) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const labelFor = (d: Date) => {
  const w = d.getDay();
  return w === 1
    ? 'T2'
    : w === 2
    ? 'T3'
    : w === 3
    ? 'T4'
    : w === 4
    ? 'T5'
    : w === 5
    ? 'T6'
    : w === 6
    ? 'T7'
    : 'CN';
};

/* ========================================================= */
/* MOBILE TIME PICKER                                        */
/* ========================================================= */

const pad2 = (n: number) => String(n).padStart(2, '0');

function TimePickerField({
  value,
  onChange,
  placeholder = 'HH:MM',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState<number>(() => {
    if (!value) return new Date().getHours();
    const [h] = value.split(':').map((x) => parseInt(x, 10));
    return Number.isFinite(h) ? h : 0;
  });
  const [minute, setMinute] = useState<number>(() => {
    if (!value) return new Date().getMinutes();
    const parts = value.split(':');
    const m = parseInt(parts[1] || '0', 10);
    return Number.isFinite(m) ? m : 0;
  });

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
      <Pressable onPress={openPicker} style={styles.inputTime}>
        <Clock size={16} color={value ? '#2563eb' : '#94a3b8'} />
        <Text style={{ color: value ? '#0f172a' : '#94a3b8', fontSize: 14, marginLeft: 6 }}>
          {value || placeholder}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={tp.overlay} onPress={() => setOpen(false)}>
          <Pressable style={tp.card} onPress={(e) => e.stopPropagation()}>
            <View style={tp.header}>
              <Clock size={24} color="#2563eb" />
              <Text style={tp.title}>Chọn thời gian</Text>
            </View>
            
            <View style={tp.pickerContainer}>
              {/* Hour Picker */}
              <View style={tp.timeColumn}>
                <TouchableOpacity 
                  onPress={() => adjustHour(1)} 
                  style={[tp.arrowButton, tp.arrowButtonUp]}
                  activeOpacity={0.7}
                >
                  <Text style={tp.arrowText}>+</Text>
                </TouchableOpacity>
                
                <View style={tp.timeDisplay}>
                  <Text style={tp.timeText}>{pad2(hour)}</Text>
                  <View style={tp.timeUnderline} />
                </View>
                
                <TouchableOpacity 
                  onPress={() => adjustHour(-1)} 
                  style={[tp.arrowButton, tp.arrowButtonDown]}
                  activeOpacity={0.7}
                >
                  <Text style={tp.arrowText}>-</Text>
                </TouchableOpacity>
                
                <Text style={tp.label}>Giờ</Text>
              </View>

              <View style={tp.separatorContainer}>
                <Text style={tp.separator}>:</Text>
                <View style={tp.separatorDots}>
                  <View style={tp.dot} />
                  <View style={tp.dot} />
                </View>
              </View>

              {/* Minute Picker */}
              <View style={tp.timeColumn}>
                <TouchableOpacity 
                  onPress={() => adjustMinute(1)} 
                  style={[tp.arrowButton, tp.arrowButtonUp]}
                  activeOpacity={0.7}
                >
                  <Text style={tp.arrowText}>+</Text>
                </TouchableOpacity>
                
                <View style={tp.timeDisplay}>
                  <Text style={tp.timeText}>{pad2(minute)}</Text>
                  <View style={tp.timeUnderline} />
                </View>
                
                <TouchableOpacity 
                  onPress={() => adjustMinute(-1)} 
                  style={[tp.arrowButton, tp.arrowButtonDown]}
                  activeOpacity={0.7}
                >
                  <Text style={tp.arrowText}>-</Text>
                </TouchableOpacity>
                
                <Text style={tp.label}>Phút</Text>
              </View>
            </View>

            {/* Quick Time Buttons */}
            <View style={tp.quickButtons}>
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  setHour(now.getHours());
                  setMinute(now.getMinutes());
                }}
                style={tp.quickBtn}
              >
                <Text style={tp.quickBtnText}>Bây giờ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(6);
                  setMinute(0);
                }}
                style={tp.quickBtn}
              >
                <Text style={tp.quickBtnText}>06:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(12);
                  setMinute(0);
                }}
                style={tp.quickBtn}
              >
                <Text style={tp.quickBtnText}>12:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setHour(18);
                  setMinute(0);
                }}
                style={tp.quickBtn}
              >
                <Text style={tp.quickBtnText}>18:00</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={tp.btnRow}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.formCancelButton}
              >
                <Text style={styles.formCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.formSaveButton}
              >
                <Text style={styles.formSaveText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const tp = StyleSheet.create({
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
    shadowColor: '#2563eb',
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
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  arrowButtonDown: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  arrowText: {
    fontSize: 24,
    color: '#2563eb',
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
    borderColor: '#2563eb',
    marginVertical: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timeText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: -1,
  },
  timeUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#2563eb',
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
    color: '#2563eb',
    marginBottom: 8,
  },
  separatorDots: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#2563eb',
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
/* HORIZONTAL CALENDAR (TRONG CÙNG FILE, KHÔNG EXPORT)       */
/* ========================================================= */

const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({
  onDateSelect,
  refreshToken,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Tuần chứa hôm nay
  const baseWeekStart = useMemo(() => startOfWeek(new Date()), []);

  // offset > 0 = lùi về quá khứ (1 = tuần trước, 2 = tuần -2, ...)
  const [weekOffset, setWeekOffset] = useState(0);

  // Ngày bắt đầu tuần đang hiển thị = baseWeekStart - weekOffset * 7 ngày
  const currentWeekStart = useMemo(() => {
    const d = new Date(baseWeekStart);
    d.setDate(d.getDate() - weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [baseWeekStart, weekOffset]);

  const [dayStatusMap, setDayStatusMap] = useState<DayStatusMap>({});
  const [loading, setLoading] = useState(false);
  const [isUpdatingWeek, setIsUpdatingWeek] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [currentWeekStart]);

  // GỌI WEEKLY REPORT THEO weekOffset, LÙI MÀU TRÊN LỊCH 1 NGÀY
  useEffect(() => {
    let cancelled = false;

    const fetchWeek = async () => {
      try {
        setLoading(true);
        setError(null);

        // offset > 0 = tuần quá khứ
        const res: any = await apiGetWeeklyReport(weekOffset);
        const rep = res?.report;

        if (!rep || !Array.isArray(rep?.habitStats)) {
          if (!cancelled) setDayStatusMap({});
          return;
        }

        const start = new Date(currentWeekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const fmt = (d: Date) => d.toISOString().split('T')[0];
        const completedPerDay: Record<string, number> = {};

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          completedPerDay[fmt(d)] = 0;
        }

        // Lùi màu 1 ngày: date trên BE = D  -> tô màu D-1 trên lịch
        rep.habitStats.forEach((hs: any) => {
          (hs.trackings || []).forEach((t: any) => {
            if (t?.status === 'completed' && t?.date) {
              const ds = String(t.date).split('T')[0];
              const dObj = new Date(ds);
              dObj.setDate(dObj.getDate() - 1);
              const shiftedKey = fmt(dObj);
              if (completedPerDay[shiftedKey] !== undefined) {
                completedPerDay[shiftedKey] += 1;
              }
            }
          });
        });

        const total =
          typeof rep.overallStats?.activeHabits === 'number' &&
          rep.overallStats.activeHabits > 0
            ? rep.overallStats.activeHabits
            : rep.habitStats.length || 1;

        const statusMap: DayStatusMap = {};
        Object.keys(completedPerDay).forEach((key) => {
          const completed = completedPerDay[key] || 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          let status: TaskStatus = 'pending';
          if (pct >= 100) status = 'completed';
          else if (pct > 0) status = 'in-progress';

          statusMap[key] = status;
        });

        if (!cancelled) setDayStatusMap(statusMap);
      } catch (err) {
        if (!cancelled) {
          setError('Không tải được dữ liệu lịch.');
          setDayStatusMap({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeek();
    return () => {
      cancelled = true;
    };
  }, [weekOffset, currentWeekStart, refreshToken]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => date.getTime() === selectedDate.getTime();

  const getMonthYearLabel = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    if (currentWeekStart.getMonth() === endDate.getMonth()) {
      return `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;
    }
    return `${monthNames[currentWeekStart.getMonth()]} - ${
      monthNames[endDate.getMonth()]
    } ${currentWeekStart.getFullYear()}`;
  };

  const handleDatePress = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (normalized.getTime() > today.getTime()) {
      Alert.alert(
        'Không thể theo dõi',
        'Bạn không thể ghi nhận thói quen cho ngày trong tương lai.',
      );
      return;
    }

    setSelectedDate(normalized);
    onDateSelect?.(normalized);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setWeekOffset(0);
    onDateSelect?.(today);
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    if (isUpdatingWeek) return;
    if (direction === 'next' && weekOffset === 0) return; // không cho xem tuần tương lai

    setIsUpdatingWeek(true);

    setTimeout(() => {
      setWeekOffset((prev) =>
        direction === 'prev' ? prev + 1 : Math.max(0, prev - 1),
      );
      setTimeout(() => setIsUpdatingWeek(false), 80);
    }, 120);
  };

  const getDayStatus = (date: Date): TaskStatus | null => {
    const key = formatDateKey(date);
    return dayStatusMap[key] ?? null;
  };

  const getDayCircleStyle = (
    status: TaskStatus | null,
    dayOfWeek: number,
    isTodayDate: boolean,
    isSelectedDate: boolean,
  ) => {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base: any[] = [stylesCal.dayCircle];

    if (isSelectedDate) base.push(stylesCal.dayCircleSelected);
    else if (isTodayDate) base.push(stylesCal.dayCircleToday);
    else if (status === 'completed') base.push(stylesCal.dayCircleCompleted);
    else if (status === 'in-progress') base.push(stylesCal.dayCircleInProgress);
    else if (isWeekend) base.push(stylesCal.dayCircleWeekend);

    return base;
  };

  return (
    <View style={stylesCal.container}>
      {/* Header */}
      <View style={stylesCal.header}>
        <Text style={stylesCal.title}>{getMonthYearLabel()}</Text>
        <View style={stylesCal.buttonGroup}>
          <TouchableOpacity
            onPress={goToToday}
            style={stylesCal.todayButton}
            activeOpacity={0.8}
          >
            <Text style={stylesCal.todayButtonText}>Hôm nay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeWeek('prev')}
            style={stylesCal.navButton}
            activeOpacity={0.8}
          >
            <ChevronLeft size={18} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeWeek('next')}
            style={stylesCal.navButton}
            activeOpacity={0.8}
          >
            <ChevronRight size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar row */}
      <View style={stylesCal.calendarRow}>
        {days.map((day) => {
          const dayOfWeek = day.getDay();
          const isTodayDate = isToday(day);
          const isSelectedDate = isSelected(day);
          const status = getDayStatus(day);

          return (
            <View key={day.getTime()} style={stylesCal.dayColumn}>
              <TouchableOpacity
                onPress={() => handleDatePress(day)}
                activeOpacity={0.8}
                style={stylesCal.dayButton}
              >
                <Text
                  style={[
                    stylesCal.dayLabel,
                    (isTodayDate || isSelectedDate) && stylesCal.dayLabelActive,
                  ]}
                >
                  {daysOfWeek[dayOfWeek]}
                </Text>
                <View
                  style={getDayCircleStyle(
                    status,
                    dayOfWeek,
                    isTodayDate,
                    isSelectedDate,
                  )}
                >
                  <Text style={stylesCal.dayNumber}>{day.getDate()}</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Loading / error */}
      {loading && (
        <View style={stylesCal.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={stylesCal.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      )}
      {error && !loading && <Text style={stylesCal.errorText}>{error}</Text>}

      {/* Legend */}
      <View style={stylesCal.legend}>
        <View style={stylesCal.legendItem}>
          <View style={[stylesCal.legendDot, stylesCal.legendCompleted]} />
          <Text style={stylesCal.legendText}>Hoàn thành</Text>
        </View>
        <View style={stylesCal.legendItem}>
          <View style={[stylesCal.legendDot, stylesCal.legendInProgress]} />
          <Text style={stylesCal.legendText}>Đang làm</Text>
        </View>
        <View style={stylesCal.legendItem}>
          <View style={[stylesCal.legendDot, stylesCal.legendPending]} />
          <Text style={stylesCal.legendText}>Chưa làm</Text>
        </View>
      </View>
    </View>
  );
};

/* ========================================================= */
/* MAIN SCREEN: FLOW STATE HABITS                            */
/* ========================================================= */

export default function FlowStateHabits() {
  const TARGET_DAYS = 21;

  // ✅ FIX: luôn lưu Date đã normalize, tránh null và tránh mutate state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const getCurrentDateStr = () => {
    // ✅ FIX: clone để không mutate selectedDate trong state
    const d = new Date(selectedDate ?? new Date());
    d.setHours(0, 0, 0, 0);
    return formatDateYMD(d);
  };

  const [habitStatus, setHabitStatus] = useState<Record<number, StatusUI | undefined>>({});
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailHabitId, setDetailHabitId] = useState<number | null>(null);
  const [moods, setmoods] = useState<Record<number, 'great' | 'good' | 'neutral' | 'bad' | undefined>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [timeStart, setTimeStart] = useState<Record<number, string>>({});
  const [timeEnd, setTimeEnd] = useState<Record<number, string>>({});
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeCountRow, setActiveCountRow] = useState<number | null>(null);
  const [countViewOpen, setCountViewOpen] = useState<Record<number, boolean>>({});
  const [countEntries, setCountEntries] = useState<Record<number, CountEntry[]>>({});
  const [editingEntry, setEditingEntry] = useState<{ habitId: number; entryId: number } | null>(null);

  const [newCountForm, setNewCountForm] = useState<{
    habitId: number | null;
    qty: number;
    start: string;
    end: string;
    note: string;
    mood?: 'great' | 'good' | 'neutral' | 'bad';
  }>({
    habitId: null,
    qty: 1,
    start: '',
    end: '',
    note: '',
    mood: undefined,
  });

  const [b2n, setB2N] = useState<Record<string, number>>({});
  const [n2b, setN2B] = useState<Record<number, string>>({});
  const nextIdRef = useRef(1);

  const [countHabitIds, setCountHabitIds] = useState<Record<number, boolean>>({});
  const [overview, setOverview] = useState<{
    totalHabits: number;
    completedToday: number;
    completionRate: number;
  } | null>(null);

  const [weeklyBars, setWeeklyBars] = useState<
    { day: string; date: number; height: number }[] | null
  >(null);

  const [unitMap, setUnitMap] = useState<
    Record<number, { current: number; goal: number; unit: string }>
  >({});
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const refreshAll = useCallback(() => setRefreshFlag((x) => x + 1), []);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editTag, setEditTag] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [typeForm, setTypeForm] = useState<string>('');

  const hhmmNow = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const onChangeTime = (timeValue: string, fieldType: 'start' | 'end') => {
    setNewCountForm((prev) => ({
      ...prev,
      [fieldType]: timeValue,
    }));
  };

  const categoryToTag = (cat?: string): 'Mindful' | 'Energy' | 'Sleep' => {
    const c = String(cat || '').toLowerCase();
    if (c === 'mindful') return 'Mindful';
    if (c === 'energy' || c === 'fitness' || c === 'health') return 'Energy';
    if (c === 'sleep') return 'Sleep';
    return 'Mindful';
  };

  const tagToColor = (
    tag: 'Mindful' | 'Energy' | 'Sleep',
  ): 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500' => {
    if (tag === 'Mindful') return 'bg-green-500';
    if (tag === 'Energy') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  // ================== LOAD DATA THEO NGÀY ĐANG CHỌN ==================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const dateStr = getCurrentDateStr();

        // 1. Lấy danh sách habits
        const res: any = await apiGetHabits();
        await notifiToast();

        const items: any[] = Array.isArray(res?.habits) ? res.habits : [];

        const newB2N: Record<string, number> = {};
        const newN2B: Record<number, string> = {};
        const countIds: Record<number, boolean> = {};
        const newUnitMap: Record<number, { current: number; goal: number; unit: string }> = {};
        const initialQuantities: Record<number, number> = {};
        let nextNum = 1;

        const uiHabits: Habit[] = items.map((h: any) => {
          const bid = String(h._id || h.id);
          let nid = newB2N[bid];
          if (!nid) {
            nid = nextNum++;
            newB2N[bid] = nid;
            newN2B[nid] = bid;
          }

          if (String(h.trackingMode || '').toLowerCase() === 'count') {
            countIds[nid] = true;
            newUnitMap[nid] = {
              current: h.completedCount || 0,
              goal: h.targetCount || 1,
              unit: h.unit || 'lần',
            };
            initialQuantities[nid] = 0;
          }

          const tag = categoryToTag(h.category);
          const color = tagToColor(tag);

          return {
            id: nid,
            title: h.name || 'Habit',
            subtitle: h.description || '',
            tag,
            tagColor: color,
            duration: `${h.currentStreak || 0} ngày`,
            icon: h.icon || '⭐',
            color: h.color || undefined,
          } as Habit;
        });

        if (cancelled) return;

        nextIdRef.current = nextNum;
        setB2N(newB2N);
        setN2B(newN2B);
        setHabitList(uiHabits);
        setCountHabitIds(countIds);
        setUnitMap(newUnitMap);
        setQuantities(initialQuantities);
        setHabitStatus({});

        // 2. Tổng quan hôm nay + báo cáo tuần
        const [ovr, report] = await Promise.all([
          apiGetTodayOverview(),
          apiGetWeeklyReport(0),
        ]);

        if (cancelled) return;

        const ov = ovr?.overview;
        if (ov && typeof ov.totalHabits === 'number') {
          setOverview({
            totalHabits: ov.totalHabits,
            completedToday: ov.completedToday,
            completionRate: ov.completedRate ?? ov.completionRate ?? 0,
          });
        } else {
          setOverview(null);
        }

        const rep = report?.report;

        // ✅ FIX: render bars theo ngày trong THÁNG hiện tại (không bỏ ngày 1)
        if (rep?.week && Array.isArray(rep?.habitStats)) {
          const today = new Date();
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          const dayMap: Record<string, number> = {};
          const fmt = (d: Date) => d.toISOString().split('T')[0];

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dayMap[fmt(d)] = 0;
          }

          rep.habitStats.forEach((hs: any) => {
            (hs.trackings || []).forEach((t: any) => {
              if (t?.status === 'completed' && t?.date) {
                const ds = String(t.date).split('T')[0];
                if (dayMap[ds] !== undefined) dayMap[ds] += 1;
              }
            });
          });

          const total =
            typeof rep.overallStats?.activeHabits === 'number' &&
            rep.overallStats.activeHabits > 0
              ? rep.overallStats.activeHabits
              : rep.habitStats.length;

          const bars: { day: string; date: number; height: number }[] = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = fmt(d);
            const completed = dayMap[key] || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            bars.push({
              day: labelFor(new Date(d)),
              height: Math.min(100, Math.max(0, pct)),
              date: d.getDate(),
            });
          }
          setWeeklyBars(bars);
        } else {
          setWeeklyBars(null);
        }

        // 3. TRACKINGS check-mode THEO NGÀY
        const uiIds = uiHabits.map((h) => h.id);
        if (uiIds.length > 0) {
          const trackResults = await Promise.all(
            uiIds.map((nid) => {
              const bid = newN2B[nid];
              if (!bid) return Promise.resolve(null);
              return apiGetHabitTrackings(bid, { date: dateStr, limit: 1 }).catch(
                () => null,
              );
            }),
          );

          if (cancelled) return;

          const initialNotes: Record<number, string> = {};
          const initialMoods: Record<number, 'great' | 'good' | 'neutral' | 'bad' | undefined> = {};
          const overrideStatus: Record<number, StatusUI | undefined> = {};

          uiIds.forEach((nid, idx) => {
            const rr: any = trackResults[idx];
            const arr = rr?.trackings ?? rr?.data ?? [];
            if (!Array.isArray(arr) || arr.length === 0) return;

            const t = arr[0];
            const s: string | undefined = t.status;
            let ui: StatusUI | undefined;
            if (s === 'completed') ui = 'success';
            else if (s === 'failed') ui = 'fail';
            else if (s === 'skipped') ui = 'skip';
            else if (s === 'in_progress') ui = 'in_progress';
            overrideStatus[nid] = ui;

            const noteVal = t.notes ?? t.note;
            if (noteVal) initialNotes[nid] = String(noteVal);

            const moodRaw = (t.mood || '').toLowerCase();
            if (moodRaw) {
              if (moodRaw === 'great' || moodRaw === 'awesome') initialMoods[nid] = 'great';
              else if (moodRaw === 'good' || moodRaw === 'ok') initialMoods[nid] = 'good';
              else if (moodRaw === 'okay' || moodRaw === 'neutral') initialMoods[nid] = 'neutral';
              else if (moodRaw === 'bad') initialMoods[nid] = 'bad';
            }
          });

          if (!cancelled) {
            if (Object.keys(initialNotes).length > 0) setNotes(initialNotes);
            if (Object.keys(initialMoods).length > 0) setmoods(initialMoods);
            if (Object.keys(overrideStatus).length > 0) {
              setHabitStatus((prev) => ({ ...prev, ...overrideStatus }));
            }
          }
        }

        // 4. SUBTRACKINGS count-mode THEO NGÀY
        const countNids = Object.keys(countIds).map((k) => Number(k));
        if (countNids.length > 0) {
          const results = await Promise.all(
            countNids.map((nid) => {
              const bid = newN2B[nid];
              if (!bid) return Promise.resolve(null);
              return apiGetHabitSubTrackings(bid, { date: dateStr, limit: 500 }).catch(
                () => null,
              );
            }),
          );

          if (cancelled) return;

          const newQuantitiesByHabit: Record<number, number> = {};
          const newStatuses: Record<number, StatusUI | undefined> = {};
          const newEntries: Record<number, CountEntry[]> = {};

          countNids.forEach((nid, idx) => {
            const rr: any = results[idx];
            if (!rr) return;

            const totalQty = rr.summary?.totalQuantity ?? 0;
            const habitMeta = newUnitMap[nid];
            const goal = habitMeta?.goal ?? rr.habit?.targetCount ?? 1;

            newQuantitiesByHabit[nid] = totalQty;

            let s: StatusUI | undefined;
            if (totalQty >= goal && goal > 0) s = 'success';
            else if (totalQty > 0 && totalQty < goal) s = 'in_progress';
            else s = undefined;

            newStatuses[nid] = s;

            const arr = Array.isArray(rr.subTrackings)
              ? rr.subTrackings.map((t: any, index: number) => ({
                  id: index + 1,
                  qty: t.quantity ?? 1,
                  start: t.time ?? t.startTime ?? undefined,
                  end: t.endTime ?? undefined,
                  note: t.note ?? undefined,
                  beId: t.id ?? t._id,
                }))
              : [];

            newEntries[nid] = arr;
          });

          if (!cancelled) {
            setQuantities((prev) => ({ ...prev, ...newQuantitiesByHabit }));
            setHabitStatus((prev) => ({ ...prev, ...newStatuses }));
            setCountEntries((prev) => ({ ...prev, ...newEntries }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setHabitList([]);
          setOverview(null);
          setWeeklyBars(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, refreshFlag]);

  useFocusEffect(
    useCallback(() => {
      setRefreshFlag((x) => x + 1);
    }, []),
  );

  const getCurrentCountValue = (habitId: number): number => {
    const entries = countEntries[habitId] ?? [];
    if (entries.length > 0) {
      return entries.reduce((acc, e) => acc + Math.max(0, e.qty || 0), 0);
    }
    const base = quantities[habitId];
    return typeof base === 'number' ? Math.max(0, base) : 0;
  };

  const computedStatus = (habitId: number): StatusUI | undefined => {
    const s = habitStatus[habitId];
    if (s) return s;
    const meta = unitMap[habitId];
    if (meta) {
      const cur = getCurrentCountValue(habitId);
      if (cur > 0 && cur < meta.goal) return 'in_progress';
    }
    return undefined;
  };

  const timeDiff = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    return mins > 0 ? mins : null;
  };

  const addCountEntry = (habitId: number) => {
    //console.log('=== OPENING COUNT ENTRY FORM ===');
    //console.log('Habit ID:', habitId);
    //console.log('Backend ID:', n2b[habitId]);
    //console.log('Unit Map:', unitMap[habitId]);
    
    const startVal = hhmmNow(); // Luôn dùng thời gian hiện tại
    const endVal = '';

    //console.log('Form data:', {
    //   habitId,
    //   qty: 1,
    //   start: startVal,
    //   end: endVal,
    //   note: '',
    //   mood: undefined,
    // });

    setNewCountForm({
      habitId,
      qty: 1, // Luôn bắt đầu với 1
      start: startVal,
      end: endVal,
      note: '',
      mood: undefined,
    });
    
    //console.log('Form opened successfully');
  };

  const cancelNewCountEntry = () => {
    setNewCountForm({
      habitId: null,
      qty: 1,
      start: '',
      end: '',
      note: '',
      mood: undefined,
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveNewCountEntry = async () => {
    if (isSaving) return;
    
    //console.log('=== SAVE COUNT ENTRY START ===');
    
    if (!newCountForm.habitId) {
      Alert.alert('Lỗi', 'Không có thói quen được chọn.');
      return;
    }
    
    const habitId = newCountForm.habitId;
    const bid = n2b[habitId];
    
    if (!bid) {
      Alert.alert('Lỗi', 'Không tìm thấy thói quen trên máy chủ.');
      return;
    }
    
    //console.log('📋 Current form data:', {
    //   habitId,
    //   bid,
    //   qty: newCountForm.qty,
    //   start: newCountForm.start,
    //   end: newCountForm.end,
    //   note: newCountForm.note,
    //   mood: newCountForm.mood
    // });
    
    //console.log('📅 Selected date info:', {
    //   selectedDate: selectedDate,
    //   selectedDateStr: getCurrentDateStr(),
    //   today: formatDateYMD(new Date())
    // });
    
    setIsSaving(true);
    
    try {
      // Sử dụng dữ liệu từ form người dùng nhập
      const selectedDateStr = getCurrentDateStr(); // Ngày được chọn trong lịch
      const todayStr = formatDateYMD(new Date());
      
      // Kiểm tra không cho phép thêm cho ngày tương lai
      if (selectedDateStr > todayStr) {
        Alert.alert('Lỗi', 'Không thể thêm thói quen cho ngày trong tương lai.');
        setIsSaving(false);
        return;
      }
      
      const payload = {
        quantity: Math.max(1, newCountForm.qty || 1), // Số lượng từ form
        date: selectedDateStr, // Ngày từ calendar
        startTime: newCountForm.start || hhmmNow(), // Thời gian từ form hoặc hiện tại
      };
      
      // Thêm các field optional nếu có
      if (newCountForm.end && newCountForm.end.trim()) {
        payload.endTime = newCountForm.end.trim();
      }
      
      if (newCountForm.note && newCountForm.note.trim()) {
        payload.note = newCountForm.note.trim();
      }
      
      if (newCountForm.mood) {
        payload.mood = newCountForm.mood === 'neutral' ? 'okay' : newCountForm.mood;
      }
      
      // Validate payload trước khi gửi
      if (!payload.startTime || !payload.date || !payload.quantity) {
        throw new Error('Thiếu thông tin bắt buộc trong payload');
      }
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(payload.startTime)) {
        throw new Error('Định dạng thời gian bắt đầu không hợp lệ');
      }
      
      if (payload.endTime && !timeRegex.test(payload.endTime)) {
        throw new Error('Định dạng thời gian kết thúc không hợp lệ');
      }
      
      //console.log('✅ Validated payload:', payload);
      //console.log('🎯 Backend ID:', bid);
      //console.log('📅 Date validation:', {
      //   selectedDate: selectedDateStr,
      //   today: todayStr,
      //   isFuture: selectedDateStr > todayStr
      // });
      
      // Gọi API đơn giản
      const result = await apiAddHabitSubTracking(bid, payload);
      console.log(result);
      
      //console.log('Success result:', result);
      
      // Reset form
      setNewCountForm({
        habitId: null,
        qty: 1,
        start: '',
        end: '',
        note: '',
        mood: undefined,
      });
      
      // Refresh
      refreshAll();
      
      Alert.alert('Thành công!', 'Đã thêm thành công');
      
    } catch (error: any) {
      console.error('=== SAVE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      let msg = 'Có lỗi xảy ra';
      if (error?.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error?.message) {
        msg = error.message;
      }
      
      Alert.alert('Lỗi', msg);
      
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCountEntry = (habitId: number, entryId: number) => {
    (async () => {
      try {
        const arr = countEntries[habitId] ?? [];
        const entry = arr.find((e) => e.id === entryId);
        const bid = n2b[habitId];
        if (entry?.beId && bid) {
          await apiDeleteHabitSubTrackings(bid, entry.beId);
          refreshAll();
        }
      } catch {}
    })();
  };

  const clearCountDay = (habitId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        if (bid) {
          await apiDeleteHabitTrackingDay(bid, getCurrentDateStr());
          refreshAll();
        }
      } catch {
      } finally {
        setCountEntries((prev) => ({ ...prev, [habitId]: [] }));
        setCountViewOpen((v) => ({ ...v, [habitId]: false }));
        setQuantities((prev) => ({ ...prev, [habitId]: 0 }));
      }
    })();
  };

  const updateEntry = (habitId: number, entryId: number, data: Partial<CountEntry>) => {
    setCountEntries((prev) => ({
      ...prev,
      [habitId]: (prev[habitId] ?? []).map((e) =>
        e.id === entryId ? { ...e, ...data } : e,
      ),
    }));
  };

  const saveEntry = (habitId: number, entryId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        const en = (countEntries[habitId] ?? []).find((x) => x.id === entryId);
        if (!bid || !en) return setEditingEntry(null);

        const dateStr = getCurrentDateStr();

        if (en.beId) {
          const body: any = {};
          if (en.start !== undefined) body.startTime = en.start;
          if (en.end !== undefined) body.endTime = en.end || null;
          if (en.qty !== undefined) body.quantity = en.qty;
          if (en.note !== undefined) body.note = en.note;
          if (en.mood !== undefined) body.mood = en.mood === 'neutral' ? 'okay' : en.mood;
          body.date = dateStr;
          await apiUpdateHabitSubTracking(bid, en.beId, body);
        } else {
          const body: any = {
            quantity: en.qty || 1,
            date: dateStr,
            startTime: en.start || hhmmNow(),
          };
          if (en.end) body.endTime = en.end;
          if (en.note) body.note = en.note;
          if (en.mood) body.mood = en.mood === 'neutral' ? 'okay' : en.mood;
          await apiAddHabitSubTracking(bid, body);
        }
        refreshAll();
      } catch {
      } finally {
        setEditingEntry(null);
      }
    })();
  };

  const toggleCountView = (habitId: number) => {
    setCountViewOpen((prev) => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  const handleStatusChange = (id: number, status: StatusUI) => {
    const prev = habitStatus[id];
    const toggledOff = prev === status;

    setHabitStatus((prevMap) => ({
      ...prevMap,
      [id]: toggledOff ? undefined : status,
    }));

    (async () => {
      const isCount = !!countHabitIds[id];
      if (isCount) return;

      const backendStatus = toggledOff
        ? 'pending'
        : status === 'success'
        ? 'completed'
        : status === 'fail'
        ? 'failed'
        : status === 'skip'
        ? 'skipped'
        : 'in_progress';

      const bid = n2b[id];
      if (!bid) return;

      try {
        const moodRaw = moods[id];
        const mood = moodRaw === 'neutral' ? 'okay' : moodRaw;
        const note = notes[id];

        const payload: any = {
          status: backendStatus,
          date: getCurrentDateStr(),
        };

        if (note && note.trim()) payload.notes = note.trim();
        if (mood) payload.mood = mood;

        await apiTrackHabit(bid, payload);
        refreshAll();
      } catch {}
    })();
  };

  const syncHabitMeta = (id: number) => {
    (async () => {
      const bid = n2b[id];
      if (!bid) return;

      const s = computedStatus(id);
      const backendStatus =
        s === 'success'
          ? 'completed'
          : s === 'fail'
          ? 'failed'
          : s === 'skip'
          ? 'skipped'
          : s === 'in_progress'
          ? 'in_progress'
          : 'pending';

      const moodRaw = moods[id];
      const mood = moodRaw === 'neutral' ? 'okay' : moodRaw;
      const note = notes[id];

      const payload: any = {
        status: backendStatus,
        date: getCurrentDateStr(),
      };

      if (note && note.trim()) payload.notes = note.trim();
      if (mood) payload.mood = mood;

      try {
        var res = await apiTrackHabit(bid, payload);
        console.log(res);
        
        refreshAll();
      } catch {}
    })();
  };

  const openEditModal = (h: Habit) => {
    const backendId = n2b[h.id];
    if (!backendId) return;
    router.push({
      pathname: '/(tabs)/habits/CreateHabitDetail',
      params: { templateId: backendId },
    });
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
    (async () => {
      try {
        const bid = n2b[editId!];
        if (bid) {
          const updates: any = {
            name: (editTitle || '').trim() || undefined,
            description: editSubtitle,
          };
          const t = String(editTag || '').toLowerCase();
          if (t) {
            if (t.includes('mind')) updates.category = 'mindful';
            else if (t.includes('sleep')) updates.category = 'sleep';
            else if (t.includes('ener') || t.includes('fit') || t.includes('health')) updates.category = 'energy';
          }
          await apiUpdateHabit(bid, updates);
          refreshAll();
        }
      } catch {
      } finally {
        closeEditModal();
      }
    })();
  };

  const deleteHabit = (id: number) => {
    (async () => {
      try {
        const bid = n2b[id];
        if (bid) await apiDeleteHabit(bid);
        refreshAll();
      } catch {
      } finally {
        if (activeMenu === id) setActiveMenu(null);
        closeConfirm();
        if (editOpen) closeEditModal();
      }
    })();
  };

  const totalHabits = habitList.length || overview?.totalHabits || 0;

  const completedCount = useMemo(() => {
    const ids = new Set<number>();
    for (const h of habitList) {
      if (habitStatus[h.id] === 'success') ids.add(h.id);
      const meta = unitMap[h.id];
      if (meta) {
        const current = getCurrentCountValue(h.id);
        if (current >= meta.goal) ids.add(h.id);
      }
    }
    return ids.size;
  }, [habitList, habitStatus, countEntries, quantities, unitMap]);

  const progressPercent =
    totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  const openDetail = (h: Habit, type: string) => {
    setTypeForm(type);
    setDetailHabitId(h.id);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailHabitId(null);
  };

  const saveCountModal = (habitId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        const meta = unitMap[habitId];
        if (!bid || !meta) return;

        const current = getCurrentCountValue(habitId);
        const target = quantities[habitId] ?? current;
        const diff = target - current;

        if (diff <= 0) return;

        const start = timeStart[habitId] || hhmmNow();
        const end = timeEnd[habitId];

        const body: any = {
          quantity: diff,
          date: getCurrentDateStr(),
          startTime: start,
        };
        if (end) body.endTime = end;

        await apiAddHabitSubTracking(bid, body);
        refreshAll();
      } catch {}
    })();
  };

  useEffect(() => {
    if (!weeklyBars || weeklyBars.length === 0) return;
    if (totalHabits <= 0) return;

    const todayLabel = labelFor(new Date());
    const newHeight = progressPercent;

    setWeeklyBars((prev) => {
      if (!prev) return prev;
      return prev.map((bar) => {
        if (bar.day !== todayLabel) return bar;
        const mergedHeight = Math.max(bar.height ?? 0, newHeight ?? 0);
        return { ...bar, height: mergedHeight };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent, totalHabits]);

  // ================== JSX ==================
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Flow State Habits</Text>
              <Text style={styles.headerSubtitle}>Theo dõi thói quen hằng ngày</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits/AddHabitModal')}
              style={styles.iconCirclePrimary}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits/HabitStreak')}
              style={styles.iconCircleGrey}
            >
              <BarChart3 size={20} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits/HabitSurvey')}
              style={styles.iconCircleGrey}
            >
              <Target size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar card */}
        <View style={styles.card}>
          <HorizontalCalendar
            refreshToken={refreshFlag}
            onDateSelect={(date) => {
              setSelectedDate(date);
            }}
          />
        </View>

        {/* Habits List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách thói quen</Text>

          {habitList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có thói quen nào từ API.</Text>
            </View>
          ) : (
            habitList.map((habit) => {
              const status = computedStatus(habit.id);
              const m = (habit.duration || '').match(/\d+/);
              const currentDays = m ? parseInt(m[0], 10) : 0;
              const goalDays = TARGET_DAYS;

              const meta = unitMap[habit.id];
              const currentVal = meta ? getCurrentCountValue(habit.id) : undefined;

              const itemPercent =
                meta && meta.goal > 0
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(((currentVal ?? 0) / meta.goal) * 100),
                      ),
                    )
                  : Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round((currentDays / (goalDays || 1)) * 100),
                      ),
                    );

              const emoji = habit.icon || '⭐';
              const progressColor =
                habit.color ||
                (emoji === '💧'
                  ? '#10b981'
                  : emoji === '🧘' || emoji === '📚'
                  ? '#3b82f6'
                  : emoji === '🚶'
                  ? '#2563eb'
                  : emoji === '🛌'
                  ? '#6366f1'
                  : '#2563eb');

              let chip = (() => {
                if (status === 'success')
                  return { label: 'Hoàn thành', bg: '#dcfce7', text: '#16a34a' };
                if (status === 'fail')
                  return { label: 'Thất bại', bg: '#fee2e2', text: '#dc2626' };
                if (status === 'skip')
                  return { label: 'Bỏ qua', bg: '#ffedd5', text: '#d97706' };
                return { label: 'Chờ làm', bg: '#e5e7eb', text: '#334155' };
              })();

              if (status === 'in_progress')
                chip = { label: 'Đang làm', bg: '#e0f2fe', text: '#0284c7' };

              const isCountHabit = !!unitMap[habit.id];

              return (
                <View key={habit.id} style={{ marginBottom: 10 }}>
                  {/* Habit row */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isCountHabit) {
                        setActiveCountRow(activeCountRow === habit.id ? null : habit.id);
                      } else {
                        setActiveRow(activeRow === habit.id ? null : habit.id);
                      }
                    }}
                    style={[
                      styles.habitRow,
                      status === 'success' && { backgroundColor: '#f0fdf4' },
                      status === 'fail' && { backgroundColor: '#fef2f2' },
                      status === 'in_progress' && { backgroundColor: '#e0f2fe' },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      {/* top row */}
                      <View style={styles.habitTopRow}>
                        <View style={styles.habitTopLeft}>
                          <View style={styles.habitIconBox}>
                            <Text style={{ fontSize: 22 }}>{emoji}</Text>
                          </View>
                          <View>
                            <Text style={styles.habitTitle}>{habit.title}</Text>
                            <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                              <Text style={[styles.statusChipText, { color: chip.text }]}>
                                {chip.label}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => setActiveMenu(activeMenu === habit.id ? null : habit.id)}
                          style={styles.moreButton}
                        >
                          <MoreVertical size={18} color="#0f172a" />
                        </TouchableOpacity>
                      </View>

                      {meta ? (
                        <>
                          {/* Progress header */}
                          <View style={styles.habitProgressHeader}>
                            <Text style={styles.habitProgressLabel}>Tiến độ</Text>
                            <Text style={styles.habitProgressValue}>
                              {`${currentVal ?? 0}/${meta.goal} ${meta.unit}`}
                            </Text>
                          </View>

                          {/* Progress bar */}
                          <View style={styles.habitProgressBarOuter}>
                            <View
                              style={[
                                styles.habitProgressBarInner,
                                { width: `${itemPercent}%`, backgroundColor: progressColor },
                              ]}
                            />
                          </View>
                        </>
                      ) : (
                        <View style={{ marginBottom: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Action row cho count-mode */}
                  {isCountHabit && activeCountRow === habit.id && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => toggleCountView(habit.id)}
                        style={[styles.actionButton, styles.actionButtonBlueSoft]}
                      >
                        <Eye size={14} color="#1e40af" />
                        <Text style={styles.actionButtonBlueText}>Xem chi tiết</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => addCountEntry(habit.id)}
                        style={[styles.actionButton, styles.actionButtonGreenSoft]}
                      >
                        <Plus size={14} color="#047857" />
                        <Text style={styles.actionButtonGreenText}>Thêm lần</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => clearCountDay(habit.id)}
                        style={[styles.actionButton, styles.actionButtonRedSoft]}
                      >
                        <Trash2 size={14} color="#dc2626" />
                        <Text style={styles.actionButtonRedText}>Xóa ngày</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Form "Thêm lần" riêng */}
                  {newCountForm.habitId === habit.id && (
                    <View style={styles.newCountFormBox}>
                      <View style={styles.rowWrap}>
                        {/* qty */}
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>Số lượng *</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={String(newCountForm.qty)}
                            onChangeText={(text) => {
                              const val = parseInt(text || '1', 10) || 1;
                              setNewCountForm((prev) => ({
                                ...prev,
                                qty: Math.max(1, val),
                              }));
                            }}
                            style={styles.input}
                          />
                        </View>

                        {/* start */}
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>Bắt đầu *</Text>
                          <TimePickerField
                            value={newCountForm.start}
                            onChange={(v) => onChangeTime(v, 'start')}
                            placeholder="HH:MM"
                          />
                        </View>

                        {/* end */}
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>Kết thúc (tùy chọn)</Text>
                          <TimePickerField
                            value={newCountForm.end}
                            onChange={(v) => onChangeTime(v, 'end')}
                            placeholder="HH:MM"
                          />
                        </View>
                      </View>

                      {/* note */}
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.formLabel}>Ghi chú</Text>
                        <TextInput
                          value={newCountForm.note}
                          onChangeText={(text) =>
                            setNewCountForm((prev) => ({ ...prev, note: text }))
                          }
                          style={styles.input}
                          placeholder="Ghi chú thêm..."
                        />
                      </View>

                      {/* mood */}
                      <View style={[styles.rowWrap, { marginTop: 10 }]}>
                        {(['great', 'good', 'neutral', 'bad'] as const).map((f) => {
                          const selected = newCountForm.mood === f;
                          const label =
                            f === 'great'
                              ? 'Tuyệt vời'
                              : f === 'good'
                              ? 'Tốt'
                              : f === 'neutral'
                              ? 'Bình thường'
                              : 'Không tốt';
                          return (
                            <TouchableOpacity
                              key={f}
                              onPress={() =>
                                setNewCountForm((prev) => ({
                                  ...prev,
                                  mood: selected ? undefined : f,
                                }))
                              }
                              style={[
                                styles.moodButton,
                                selected && styles.moodButtonSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.moodButtonText,
                                  selected && styles.moodButtonTextSelected,
                                ]}
                              >
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* buttons */}
                      <View style={styles.formButtonRow}>
                        <TouchableOpacity
                          onPress={cancelNewCountEntry}
                          style={styles.formCancelButton}
                        >
                          <Text style={styles.formCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={saveNewCountEntry}
                          style={[
                            styles.formSaveButton,
                            (isSaving || !newCountForm.start || newCountForm.qty < 1) && {
                              backgroundColor: '#94a3b8',
                              opacity: 0.6
                            }
                          ]}
                          disabled={isSaving || !newCountForm.start || newCountForm.qty < 1}
                        >
                          <Text style={styles.formSaveText}>
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* danh sách count entries */}
                  {countViewOpen[habit.id] && (
                    <View style={{ marginTop: 8 }}>
                      {(countEntries[habit.id] ?? []).length === 0 ? (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyText}>
                            Chưa có lần nào cho ngày này. Nhấn &quot;Thêm lần&quot; để bắt đầu.
                          </Text>
                        </View>
                      ) : (
                        (countEntries[habit.id] ?? []).map((en, idx) => {
                          const dur = timeDiff(en.start, en.end);
                          return (
                            <View key={en.id} style={styles.entryBox}>
                              <View style={styles.entryHeaderRow}>
                                <Text style={styles.entryTitle}>📘 Lần {idx + 1}</Text>
                                {en.start && en.end && (
                                  <Text style={styles.entryTime}>
                                    {en.start} - {en.end}
                                    {dur ? ` (${dur} phút)` : ''}
                                  </Text>
                                )}
                              </View>

                              <Text style={styles.entryQty}>
                                {en.qty} {unitMap[habit.id]?.unit || ''}
                              </Text>

                              {en.note ? <Text style={styles.entryNote}>“{en.note}”</Text> : null}

                              <View style={styles.entryButtonRow}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setEditingEntry({ habitId: habit.id, entryId: en.id })
                                  }
                                  style={styles.entryEditButton}
                                >
                                  <Pencil size={14} color="#b45309" />
                                  <Text style={styles.entryEditText}>Sửa</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => deleteCountEntry(habit.id, en.id)}
                                  style={styles.entryDeleteButton}
                                >
                                  <Trash2 size={14} color="#dc2626" />
                                  <Text style={styles.entryDeleteText}>Xóa</Text>
                                </TouchableOpacity>
                              </View>

                              {editingEntry &&
                                editingEntry.habitId === habit.id &&
                                editingEntry.entryId === en.id && (
                                  <View style={styles.entryEditBox}>
                                    <View style={styles.rowWrap}>
                                      <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Số lượng</Text>
                                        <TextInput
                                          keyboardType="numeric"
                                          value={String(en.qty)}
                                          onChangeText={(text) =>
                                            updateEntry(habit.id, en.id, {
                                              qty:
                                                parseInt(text || '0', 10) >= 0
                                                  ? parseInt(text || '0', 10)
                                                  : 0,
                                            })
                                          }
                                          style={styles.input}
                                        />
                                      </View>

                                      <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Bắt đầu</Text>
                                        <TimePickerField
                                          value={en.start || ''}
                                          onChange={(v) =>
                                            updateEntry(habit.id, en.id, { start: v })
                                          }
                                          placeholder="HH:MM"
                                        />
                                      </View>

                                      <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Kết thúc</Text>
                                        <TimePickerField
                                          value={en.end || ''}
                                          onChange={(v) =>
                                            updateEntry(habit.id, en.id, { end: v })
                                          }
                                          placeholder="HH:MM"
                                        />
                                      </View>
                                    </View>

                                    <View style={{ marginTop: 10 }}>
                                      <Text style={styles.formLabel}>Ghi chú</Text>
                                      <TextInput
                                        value={en.note || ''}
                                        onChangeText={(text) =>
                                          updateEntry(habit.id, en.id, { note: text })
                                        }
                                        style={styles.input}
                                      />
                                    </View>

                                    <View style={[styles.rowWrap, { marginTop: 10 }]}>
                                      {(['great', 'good', 'neutral', 'bad'] as const).map((f) => {
                                        const selected = en.mood === f;
                                        const label =
                                          f === 'great'
                                            ? 'Tuyệt vời'
                                            : f === 'good'
                                            ? 'Tốt'
                                            : f === 'neutral'
                                            ? 'Bình thường'
                                            : 'Không tốt';
                                        return (
                                          <TouchableOpacity
                                            key={f}
                                            onPress={() =>
                                              updateEntry(habit.id, en.id, {
                                                mood: selected ? undefined : f,
                                              })
                                            }
                                            style={[
                                              styles.moodButton,
                                              selected && styles.moodButtonSelected,
                                            ]}
                                          >
                                            <Text
                                              style={[
                                                styles.moodButtonText,
                                                selected && styles.moodButtonTextSelected,
                                              ]}
                                            >
                                              {label}
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>

                                    <View style={styles.formButtonRow}>
                                      <TouchableOpacity
                                        onPress={() => setEditingEntry(null)}
                                        style={styles.formCancelButton}
                                      >
                                        <Text style={styles.formCancelText}>Hủy</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={() => saveEntry(habit.id, en.id)}
                                        style={styles.formSaveButton}
                                      >
                                        <Text style={styles.formSaveText}>Lưu</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}

                  {/* Action row habit thường */}
                  {!isCountHabit && activeRow === habit.id && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => openDetail(habit, 'Xong')}
                        style={[styles.actionButton, styles.actionButtonBlueSoft]}
                      >
                        <Eye size={14} color="#1e40af" />
                        <Text style={styles.actionButtonBlueText}>Đánh dấu</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openDetail(habit, 'Lưu')}
                        style={[styles.actionButton, styles.actionButtonAmberSoft]}
                      >
                        <Pencil size={14} color="#b45309" />
                        <Text style={styles.actionButtonAmberText}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => askDelete(habit.id, habit.title)}
                        style={[styles.actionButton, styles.actionButtonRedSoft]}
                      >
                        <Trash2 size={14} color="#dc2626" />
                        <Text style={styles.actionButtonRedText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Flyout menu */}
                  {activeMenu === habit.id && (
                    <View style={styles.flyoutMenu}>
                      <TouchableOpacity
                        onPress={() => {
                          setActiveMenu(null);
                          openEditModal(habit);
                        }}
                        style={styles.flyoutItem}
                      >
                        <Text style={styles.flyoutItemText}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setActiveMenu(null);
                          askDelete(habit.id, habit.title);
                        }}
                        style={styles.flyoutItem}
                      >
                        <Text style={[styles.flyoutItemText, { color: '#dc2626' }]}>Xóa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setActiveMenu(null);
                          const bid = n2b[habit.id];
                          if (bid) {
                            router.push({
                              pathname: '/(tabs)/habits/RunningHabitTracker',
                              params: { habitId: bid },
                            });
                          } else {
                            router.push('/(tabs)/habits/RunningHabitTracker');
                          }
                        }}
                        style={styles.flyoutItem}
                      >
                        <Text style={[styles.flyoutItemText, { color: '#2563eb' }]}>Thông tin</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal chi tiết */}
      <Modal
        visible={detailOpen && detailHabitId != null}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {detailHabitId != null &&
              (() => {
                const h = habitList.find((x) => x.id === detailHabitId)!;
                const status = computedStatus(h.id);

                let chip = (() => {
                  if (status === 'success') return { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' };
                  if (status === 'fail') return { label: 'Thất bại', color: '#dc2626', bg: '#fee2e2' };
                  if (status === 'skip') return { label: 'Bỏ qua', color: '#d97706', bg: '#ffedd5' };
                  return { label: 'Chờ làm', color: '#334155', bg: '#e5e7eb' };
                })();

                if (status === 'in_progress') chip = { label: 'Đang làm', color: '#0284c7', bg: '#e0f2fe' };

                const noteVal = notes[h.id] || '';
                const meta = unitMap[h.id];
                const q = meta != null ? getCurrentCountValue(h.id) : 0;

                const startVal = timeStart[h.id] ?? '';
                const endVal = timeEnd[h.id] ?? '';

                return (
                  <>
                    <View style={styles.detailHeaderRow}>
                      <View style={styles.habitIconBox}>
                        <Text style={{ fontSize: 22 }}>{h.icon || '⭐'}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.habitTitle}>{h.title}</Text>
                        {!meta && (
                          <View style={[styles.statusChip, { backgroundColor: chip.bg, marginTop: 4 }]}>
                            <Text style={[styles.statusChipText, { color: chip.color }]}>
                              Chế độ: {chip.label}
                            </Text>
                          </View>
                        )}
                      </View>

                      {meta && (
                        <Text style={styles.detailQtyTop}>
                          {q}/{meta.goal} {meta.unit}
                        </Text>
                      )}
                    </View>

                    {meta ? (
                      <>
                        {/* count-mode */}
                        <View style={{ marginTop: 10 }}>
                          <Text style={styles.formLabel}>Số lượng *</Text>
                          <View style={styles.detailCountRow}>
                            <TouchableOpacity
                              onPress={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [h.id]: Math.max(0, (prev[h.id] ?? meta.current ?? 0) - 1),
                                }))
                              }
                              style={styles.detailCountBtnMinus}
                            >
                              <Text style={styles.detailCountBtnMinusText}>-</Text>
                            </TouchableOpacity>

                            <View style={{ alignItems: 'center' }}>
                              <Text style={styles.detailCountNumber}>{q}</Text>
                              <Text style={styles.detailCountUnit}>{meta.unit}</Text>
                            </View>

                            <TouchableOpacity
                              onPress={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [h.id]: (prev[h.id] ?? meta.current ?? 0) + 1,
                                }))
                              }
                              style={styles.detailCountBtnPlus}
                            >
                              <Text style={styles.detailCountBtnPlusText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.detailTimeBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Clock size={14} color="#0f172a" />
                            <Text style={styles.detailTimeTitle}> Thời gian thực hiện *</Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.detailTimeLabel}>Bắt đầu *</Text>
                              <TimePickerField
                                value={startVal}
                                onChange={(v) => setTimeStart((prev) => ({ ...prev, [h.id]: v }))}
                                placeholder="HH:MM"
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.detailTimeLabel}>Kết thúc (tùy chọn)</Text>
                              <TimePickerField
                                value={endVal}
                                onChange={(v) => setTimeEnd((prev) => ({ ...prev, [h.id]: v }))}
                                placeholder="HH:MM"
                              />
                            </View>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* check-mode */}
                        <Text style={[styles.formLabel, { marginTop: 10 }]}>Trạng thái *</Text>
                        <View style={styles.rowWrap}>
                          {(
                            [
                              { key: 'success', label: 'Hoàn thành', color: '#16a34a' },
                              { key: 'skip', label: 'Bỏ qua', color: '#d97706' },
                              { key: 'fail', label: 'Thất bại', color: '#dc2626' },
                            ] as const
                          ).map((opt) => {
                            const selected = status === opt.key;
                            return (
                              <TouchableOpacity
                                key={opt.key}
                                style={[styles.statusBtn, selected && { borderColor: opt.color }]}
                                onPress={() => handleStatusChange(h.id, opt.key)}
                              >
                                {opt.key === 'success' && <Check size={16} color={opt.color} />}
                                {opt.key === 'skip' && <Minus size={16} color={opt.color} />}
                                {opt.key === 'fail' && <X size={16} color={opt.color} />}
                                <Text style={[styles.statusBtnText, selected && { color: opt.color }]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {/* Ghi chú */}
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.formLabel}>Ghi chú</Text>
                      <TextInput
                        placeholder="Thêm ghi chú về buổi thực hiện..."
                        value={noteVal}
                        onChangeText={(text) => setNotes((prev) => ({ ...prev, [h.id]: text }))}
                        multiline
                        maxLength={200}
                        style={styles.textarea}
                      />
                      <Text style={styles.noteCounter}>{noteVal.length}/200 ký tự</Text>
                    </View>

                    {/* Cảm giác */}
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.formLabel}>Cảm giác</Text>
                      <View style={styles.rowWrap}>
                        {(
                          [
                            { key: 'great', label: 'Tuyệt vời', emoji: '😊' },
                            { key: 'good', label: 'Tốt', emoji: '🙂' },
                            { key: 'neutral', label: 'Bình thường', emoji: '😐' },
                            { key: 'bad', label: 'Không tốt', emoji: '😞' },
                          ] as const
                        ).map((opt) => {
                          const selected = moods[h.id] === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              style={[
                                styles.moodButton,
                                selected && styles.moodButtonSelected,
                                { flexBasis: '48%' },
                              ]}
                              onPress={() =>
                                setmoods((prev) => ({
                                  ...prev,
                                  [h.id]: selected ? undefined : opt.key,
                                }))
                              }
                            >
                              <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                              <Text style={[styles.moodButtonText, selected && styles.moodButtonTextSelected]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.modalButtonsRow}>
                      <TouchableOpacity onPress={closeDetail} style={styles.formCancelButton}>
                        <Text style={styles.formCancelText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const metaLocal = unitMap[h.id];
                          if (metaLocal) saveCountModal(h.id);
                          else syncHabitMeta(h.id);
                          closeDetail();
                        }}
                        style={styles.formSaveButton}
                      >
                        <Text style={styles.formSaveText}>{typeForm}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>

      {/* Modal chỉnh sửa */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEditModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chỉnh sửa thói quen</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Tên thói quen" />
            <TextInput style={styles.input} value={editSubtitle} onChangeText={setEditSubtitle} placeholder="Mô tả / ghi chú" />
            <TextInput style={styles.input} value={editTag} onChangeText={setEditTag} placeholder="Tag (Mindful, Energy, ...)" />
            <View style={styles.modalFooterRow}>
              <TouchableOpacity onPress={() => editId != null && askDelete(editId, editTitle || '')}>
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={closeEditModal} style={styles.formCancelButton}>
                  <Text style={styles.formCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={styles.formSaveButton}>
                  <Text style={styles.formSaveText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xóa thói quen &quot;{confirmName}&quot;?</Text>
            <Text style={styles.modalSubText}>Hành động này không thể hoàn tác.</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={closeConfirm} style={styles.formCancelButton}>
                <Text style={styles.formCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmId != null && deleteHabit(confirmId)}
                style={[styles.formSaveButton, { backgroundColor: '#ef4444' }]}
              >
                <Text style={styles.formSaveText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ========================================================= */
/* STYLES MAIN                                               */
/* ========================================================= */

const styles = StyleSheet.create({
  inputTime: {
    width: '100%',
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.6)',
    padding: 16,
    marginHorizontal: 10,
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.6)',
    marginHorizontal: 10,
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  iconCirclePrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGrey: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
  habitRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.4)',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  habitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.7)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  habitProgressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  habitProgressValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '800',
  },
  habitProgressBarOuter: {
    marginTop: 6,
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  habitProgressBarInner: {
    height: '100%',
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionButtonBlueSoft: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  actionButtonGreenSoft: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  actionButtonRedSoft: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionButtonAmberSoft: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  actionButtonBlueText: {
    fontWeight: '800',
    color: '#1e40af',
    fontSize: 13,
  },
  actionButtonGreenText: {
    fontWeight: '800',
    color: '#047857',
    fontSize: 13,
  },
  actionButtonRedText: {
    fontWeight: '800',
    color: '#dc2626',
    fontSize: 13,
  },
  actionButtonAmberText: {
    fontWeight: '800',
    color: '#b45309',
    fontSize: 13,
  },
  newCountFormBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formField: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  moodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moodButtonSelected: {
    borderColor: '#2563eb',
  },
  moodButtonText: {
    fontWeight: '700',
    color: '#334155',
    fontSize: 13,
  },
  moodButtonTextSelected: {
    color: '#2563eb',
  },
  formButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  formCancelButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formCancelText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14,
  },
  formSaveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formSaveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  entryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 8,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTitle: {
    fontWeight: '800',
    color: '#0f172a',
  },
  entryTime: {
    fontSize: 12,
    color: '#0f172a',
  },
  entryQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 4,
  },
  entryNote: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#475569',
  },
  entryButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  entryEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryEditText: {
    color: '#b45309',
    fontWeight: '800',
    fontSize: 13,
  },
  entryDeleteText: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 13,
  },
  entryEditBox: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  flyoutMenu: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.7)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  flyoutItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  flyoutItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.6)',
    padding: 18,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailQtyTop: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  detailCountBtnMinus: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCountBtnMinusText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  detailCountBtnPlus: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCountBtnPlusText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  detailCountNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailCountUnit: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  detailTimeBox: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  detailTimeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailTimeLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 4,
  },
  textarea: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.9)',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  noteCounter: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalFooterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
});

/* ========================================================= */
/* STYLES - CALENDAR                                         */
/* ========================================================= */

const stylesCal = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayButton: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  dayLabelActive: {
    color: '#2563eb',
  },
  dayCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#2563eb',
  },
  dayCircleToday: {
    backgroundColor: '#3b82f6',
  },
  dayCircleCompleted: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  dayCircleInProgress: {
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#facc15',
  },
  dayCircleWeekend: {
    backgroundColor: '#fef2f2',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  legend: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    marginRight: 6,
  },
  legendCompleted: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  legendInProgress: {
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#facc15',
  },
  legendPending: {
    backgroundColor: '#e5e7eb',
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#dc2626',
  },
});
