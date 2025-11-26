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
  TrendingUp,
  Clock,
  Target,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
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
  deleteSubTracking as apiDeleteHabitSubTracking,
  deleteTrackingDay as apiDeleteHabitTrackingDay,
  // Dashboard & Reports
  getTodayOverview as apiGetTodayOverview,
  getWeeklyReport as apiGetWeeklyReport,
  // tracking habit check-mode
  getHabitTrackings as apiGetHabitTrackings,
} from '../../../server/habits';

type Habit = {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500';
  duration: string;
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

export default function FlowStateHabits() {
  const TARGET_DAYS = 21;

  const [chartView, setChartView] = useState<'day' | 'week' | 'month'>('day');
  const [habitStatus, setHabitStatus] = useState<
    Record<number, 'success' | 'fail' | 'skip' | 'in_progress' | undefined>
  >({});
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailHabitId, setDetailHabitId] = useState<number | null>(null);
  const [moods, setmoods] = useState<
    Record<number, 'great' | 'good' | 'neutral' | 'bad' | undefined>
  >({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [timeStart, setTimeStart] = useState<Record<number, string>>({});
  const [timeEnd, setTimeEnd] = useState<Record<number, string>>({});
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeCountRow, setActiveCountRow] = useState<number | null>(null);
  const [countViewOpen, setCountViewOpen] = useState<Record<number, boolean>>({});
  const [countEntries, setCountEntries] = useState<Record<number, CountEntry[]>>({});
  const [editingEntry, setEditingEntry] = useState<{ habitId: number; entryId: number } | null>(
    null
  );

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
  const [weeklyBars, setWeeklyBars] = useState<{ day: string; height: number }[] | null>(null);
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

  const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const hhmmNow = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const categoryToTag = (cat?: string): 'Mindful' | 'Energy' | 'Sleep' => {
    const c = String(cat || '').toLowerCase();
    if (c === 'mindful') return 'Mindful';
    if (c === 'energy' || c === 'fitness' || c === 'health') return 'Energy';
    if (c === 'sleep') return 'Sleep';
    return 'Mindful';
  };

  const tagToColor = (
    tag: 'Mindful' | 'Energy' | 'Sleep'
  ): 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500' => {
    if (tag === 'Mindful') return 'bg-green-500';
    if (tag === 'Energy') return 'bg-orange-500';
    return 'bg-blue-500';
  };

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

  // Load habits + overview + weekly report + tracking hôm nay + count-mode
  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGetHabits();
        const items: any[] = Array.isArray(res?.habits) ? res.habits : [];

        const newB2N: Record<string, number> = { ...b2n };
        const newN2B: Record<number, string> = { ...n2b };
        const newStatus: Record<number, 'success' | 'fail' | 'skip' | undefined> = {};
        let nextNum = nextIdRef.current;

        const countIds: Record<number, boolean> = {};
        const newUnitMap: Record<number, { current: number; goal: number; unit: string }> = {};
        const initialQuantities: Record<number, number> = {};

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
            initialQuantities[nid] = h.completedCount || 0;
          }

          const tag = categoryToTag(h.category);
          const color = tagToColor(tag);

          const s: string | undefined = h.todayStatus;
          const ui: 'success' | 'fail' | 'skip' | undefined =
            s === 'completed'
              ? 'success'
              : s === 'failed'
              ? 'fail'
              : s === 'skipped'
              ? 'skip'
              : undefined;
          newStatus[nid] = ui;

          return {
            id: nid,
            title: h.name || 'Habit',
            subtitle: h.description || '',
            tag,
            tagColor: color,
            duration: `${h.currentStreak || 0} ngày`,
          } as Habit;
        });

        nextIdRef.current = nextNum;
        setB2N(newB2N);
        setN2B(newN2B);
        setHabitList(uiHabits);
        setHabitStatus(newStatus);
        setCountHabitIds(countIds);
        setUnitMap(newUnitMap);
        setQuantities(initialQuantities);

        // Tổng quan + báo cáo tuần
        const [ovr, report] = await Promise.all([apiGetTodayOverview(), apiGetWeeklyReport(0)]);

        const ov = ovr?.overview;
        if (ov && typeof ov.totalHabits === 'number') {
          setOverview({
            totalHabits: ov.totalHabits,
            completedToday: ov.completedToday,
            completionRate: ov.completedRate ?? ov.completionRate ?? 0,
          });
        }

        const rep = report?.report;
        if (rep?.week && Array.isArray(rep?.habitStats)) {
          const start = new Date(rep.week.start);
          const end = new Date(rep.week.end);
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
            typeof rep.overallStats?.activeHabits === 'number' && rep.overallStats.activeHabits > 0
              ? rep.overallStats.activeHabits
              : uiHabits.length;

          const bars: { day: string; height: number }[] = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = fmt(d);
            const completed = dayMap[key] || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            bars.push({
              day: labelFor(new Date(d)),
              height: Math.min(100, Math.max(0, pct)),
            });
          }
          setWeeklyBars(bars);
        } else {
          setWeeklyBars(null);
        }

        // Load tracking hôm nay
        const uiIds = uiHabits.map((h) => h.id);
        if (uiIds.length > 0) {
          const trackResults = await Promise.all(
            uiIds.map((nid) => {
              const bid = newN2B[nid];
              if (!bid) return Promise.resolve(null);
              return apiGetHabitTrackings(bid, { date: todayStr(), limit: 1 }).catch(() => null);
            })
          );

          const initialNotes: Record<number, string> = {};
          const initialmoods: Record<
            number,
            'great' | 'good' | 'neutral' | 'bad' | undefined
          > = {};
          const overrideStatus: Record<
            number,
            'success' | 'fail' | 'skip' | 'in_progress' | undefined
          > = {};

          uiIds.forEach((nid, idx) => {
            const res: any = trackResults[idx];
            const arr = res?.trackings ?? res?.data ?? [];
            if (!Array.isArray(arr) || arr.length === 0) return;

            const t = arr[0];

            const s: string | undefined = t.status;
            let ui: 'success' | 'fail' | 'skip' | 'in_progress' | undefined;
            if (s === 'completed') ui = 'success';
            else if (s === 'failed') ui = 'fail';
            else if (s === 'skipped') ui = 'skip';
            else if (s === 'in_progress') ui = 'in_progress';
            overrideStatus[nid] = ui;

            const noteVal = t.notes ?? t.note;
            if (noteVal) {
              initialNotes[nid] = String(noteVal);
            }

            const moodRaw = (t.mood || '').toLowerCase();
            if (moodRaw) {
              if (moodRaw === 'great' || moodRaw === 'awesome') {
                initialmoods[nid] = 'great';
              } else if (moodRaw === 'good' || moodRaw === 'ok') {
                initialmoods[nid] = 'good';
              } else if (moodRaw === 'okay' || moodRaw === 'neutral') {
                initialmoods[nid] = 'neutral';
              } else if (moodRaw === 'bad') {
                initialmoods[nid] = 'bad';
              }
            }
          });

          if (Object.keys(initialNotes).length > 0) {
            setNotes(initialNotes);
          }
          if (Object.keys(initialmoods).length > 0) {
            setmoods(initialmoods);
          }
          if (Object.keys(overrideStatus).length > 0) {
            setHabitStatus((prev) => ({ ...prev, ...overrideStatus }));
          }
        }

        // Load count subtrackings
        const countNids = Object.keys(countIds).map((k) => Number(k));
        if (countNids.length > 0) {
          const results = await Promise.all(
            countNids.map((nid) => {
              const bid = newN2B[nid];
              if (!bid) return Promise.resolve(null);
              return apiGetHabitSubTrackings(bid, { date: todayStr(), limit: 500 }).catch(
                () => null
              );
            })
          );

          const override: Record<number, number> = {};
          countNids.forEach((nid, idx) => {
            const res = results[idx] as any;
            const arr = res?.subTrackings ?? res?.data ?? [];
            if (Array.isArray(arr)) {
              const total = arr.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0);
              override[nid] = total;
            }
          });
          setQuantities((prev) => ({ ...prev, ...override }));
        }
      } catch (err) {
        console.error('[habits.index] load error:', err);
        setHabitList([]);
        setOverview(null);
        setWeeklyBars(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  useFocusEffect(
    useCallback(() => {
      setRefreshFlag((x) => x + 1);
    }, [])
  );

  const getCurrentCountValue = (habitId: number): number => {
    const meta = unitMap[habitId];
    if (!meta) return 0;
    const entries = countEntries[habitId] ?? [];
    if (entries.length > 0) {
      return entries.reduce((acc, e) => acc + Math.max(0, e.qty || 0), 0);
    }
    const base = quantities[habitId];
    return typeof base === 'number' ? Math.max(0, base) : 0;
  };

  const computedStatus = (
    habitId: number
  ): 'success' | 'fail' | 'skip' | 'in_progress' | undefined => {
    const s = habitStatus[habitId];
    if (s) return s;
    const meta = unitMap[habitId];
    if (meta) {
      const cur = getCurrentCountValue(habitId);
      if (cur > 0 && cur < meta.goal) return 'in_progress';
    }
    return undefined;
  };

  // auto sync status count-mode theo số lượng (frontend)
  useEffect(() => {
    habitList.forEach((h) => {
      const meta = unitMap[h.id];
      if (!meta) return;
      const cur = getCurrentCountValue(h.id);
      const isSuccess = habitStatus[h.id] === 'success';
      if (cur >= meta.goal && !isSuccess) {
        handleStatusChange(h.id, 'success');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countEntries, quantities]);

  const timeDiff = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    return mins > 0 ? mins : null;
  };

  const addCountEntry = (habitId: number) => {
    const meta = unitMap[habitId];
    const currentVal = getCurrentCountValue(habitId);
    const baseQty = meta ? Math.max(1, currentVal || meta.current || 1) : 1;

    const startVal = timeStart[habitId] ?? hhmmNow();
    const endVal = timeEnd[habitId] ?? '';

    setNewCountForm({
      habitId,
      qty: baseQty,
      start: startVal,
      end: endVal,
      note: '',
      mood: moods[habitId],
    });
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

  const saveNewCountEntry = () => {
    if (!newCountForm.habitId) return;

    const habitId = newCountForm.habitId;

    (async () => {
      try {
        const bid = n2b[habitId];
        if (!bid) {
          alert('Lỗi', 'Không tìm thấy thói quen trên máy chủ.');
          return;
        }

        const qty = newCountForm.qty > 0 ? newCountForm.qty : 1;
        const body: any = {
          quantity: qty,
          date: todayStr(),
          startTime: newCountForm.start || hhmmNow(),
        };

        if (newCountForm.end) body.endTime = newCountForm.end;
        if (newCountForm.note.trim()) body.note = newCountForm.note.trim();
        if (newCountForm.mood) {
          body.mood = newCountForm.mood === 'neutral' ? 'okay' : newCountForm.mood;
        }

        await apiAddHabitSubTracking(bid, body);

        setNewCountForm({
          habitId: null,
          qty: 1,
          start: '',
          end: '',
          note: '',
          mood: undefined,
        });

        loadSubTrackingsForToday(habitId);
        refreshAll();
      } catch (err: any) {
        console.error('[habits.index] add subtrack (new form) error:', err);
        alert(err.message);
      }
    })();
  };

  const deleteCountEntry = (habitId: number, entryId: number) => {
    (async () => {
      try {
        const arr = countEntries[habitId] ?? [];
        const entry = arr.find((e) => e.id === entryId);
        const bid = n2b[habitId];
        if (entry?.beId && bid) {
          await apiDeleteHabitSubTracking(bid, entry.beId);
          refreshAll();
          toggleCountView(habitId);
          toggleCountView(habitId);
        }
      } catch (err) {
        console.error('[habits.index] delete subtrack error:', err);
      }
    })();
  };

  const clearCountDay = (habitId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        if (bid) {
          await apiDeleteHabitTrackingDay(bid, todayStr());
          refreshAll();
        }
      } catch (err) {
        console.error('[habits.index] clear day error:', err);
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
      [habitId]: (prev[habitId] ?? []).map((e) => (e.id === entryId ? { ...e, ...data } : e)),
    }));
  };

  const saveEntry = (habitId: number, entryId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        const en = (countEntries[habitId] ?? []).find((x) => x.id === entryId);
        if (!bid || !en) return setEditingEntry(null);
        if (en.beId) {
          const body: any = {};
          if (en.start !== undefined) body.startTime = en.start;
          if (en.end !== undefined) body.endTime = en.end || null;
          if (en.qty !== undefined) body.quantity = en.qty;
          if (en.note !== undefined) body.note = en.note;
          if (en.mood !== undefined) body.mood = en.mood === 'neutral' ? 'okay' : en.mood;
          await apiUpdateHabitSubTracking(bid, en.beId, body);
        } else {
          const body: any = {
            quantity: en.qty || 1,
            date: todayStr(),
            startTime: en.start || hhmmNow(),
          };
          if (en.end) body.endTime = en.end;
          if (en.note) body.note = en.note;
          if (en.mood) body.mood = en.mood === 'neutral' ? 'okay' : en.mood;
          await apiAddHabitSubTracking(bid, body);
        }
        refreshAll();
      } catch (err) {
        console.error('[habits.index] save subtrack error:', err);
      } finally {
        setEditingEntry(null);
      }
    })();
  };

  const loadSubTrackingsForToday = (habitId: number) => {
    (async () => {
      try {
        const bid = n2b[habitId];
        if (!bid) return;
        const res: any = await apiGetHabitSubTrackings(bid, {
          date: todayStr(),
          limit: 100,
        });
        const arr: CountEntry[] = Array.isArray(res?.subTrackings)
          ? res.subTrackings.map((t: any, idx: number) => ({
              id: idx + 1,
              qty: t.quantity ?? 1,
              start: t.time ?? t.startTime ?? undefined,
              end: t.endTime ?? undefined,
              note: t.note ?? undefined,
              beId: t.id ?? t._id,
            }))
          : [];
        setCountEntries((prev) => ({ ...prev, [habitId]: arr }));
        const total = arr.reduce((sum, e) => sum + (e.qty || 0), 0);
        setQuantities((prev) => ({ ...prev, [habitId]: total }));
      } catch (err) {
        console.error('[habits.index] load subtrackings error:', err);
      }
    })();
  };

  const toggleCountView = (habitId: number) => {
    setCountViewOpen((prev) => {
      const next = !prev[habitId];
      if (next) loadSubTrackingsForToday(habitId);
      return { ...prev, [habitId]: next };
    });
  };

  const handleStatusChange = (
    id: number,
    status: 'success' | 'fail' | 'skip' | 'in_progress'
  ) => {
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
          date: todayStr(),
        };

        if (note && note.trim()) {
          payload.notes = note.trim();
        }

        if (mood) {
          payload.mood = mood;
        }

        await apiTrackHabit(bid, payload);
        refreshAll();
      } catch (err) {
        console.error('[habits.index] track error:', err);
      }
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
        date: todayStr(),
      };

      if (note && note.trim()) {
        payload.notes = note.trim();
      }
      if (mood) {
        payload.mood = mood;
      }

      try {
        await apiTrackHabit(bid, payload);
        refreshAll();
      } catch (err) {
        console.error('[habits.index] syncHabitMeta error:', err);
      }
    })();
  };

  const getChartData = () => {
    if (chartView === 'day') {
      return weeklyBars ?? [];
    }
    return [];
  };

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
            else if (t.includes('ener') || t.includes('fit') || t.includes('health'))
              updates.category = 'energy';
          }
          await apiUpdateHabit(bid, updates);
          refreshAll();
        }
      } catch (err) {
        console.error('[habits.index] update error:', err);
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
      } catch (err) {
        console.error('[habits.index] delete error:', err);
      } finally {
        if (activeMenu === id) setActiveMenu(null);
        closeConfirm();
        if (editOpen) closeEditModal();
      }
    })();
  };

  const chartData = getChartData();

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

  const openDetail = (h: Habit) => {
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
          date: todayStr(),
          startTime: start,
        };
        if (end) body.endTime = end;

        await apiAddHabitSubTracking(bid, body);

        loadSubTrackingsForToday(habitId);
      } catch (err) {
        console.error('[habits.index] saveCountModal error:', err);
      }
    })();
  };

  useEffect(() => {
    if (!weeklyBars || weeklyBars.length === 0) return;
    if (totalHabits <= 0) return;

    const todayLabel = labelFor(new Date());
    const newHeight = progressPercent;

    setWeeklyBars((prev) => {
      if (!prev) return prev;
      return prev.map((bar) =>
        bar.day === todayLabel ? { ...bar, height: newHeight } : bar
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent, totalHabits]);

  // ================== JSX MOBILE ==================
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
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

        {/* Progress Summary */}
        <View style={styles.card}>
          <View style={styles.progressHeaderRow}>
            <View style={styles.todayChip}>
              <TrendingUp size={16} color="#4338ca" />
              <Text style={styles.todayChipText}>Tiến độ hôm nay</Text>
            </View>
            <Text style={styles.progressCountText}>
              {completedCount}/{totalHabits} hoàn thành
            </Text>
          </View>

          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.progressFooterRow}>
            <Text style={styles.progressGoalText}>Mục tiêu: hoàn thành tất cả</Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Chart (rút gọn, vẫn giữ logic) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Biểu đồ tiến bộ</Text>
            <View style={styles.chartTabsRow}>
              {(['day', 'week', 'month'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setChartView(v)}
                  style={[
                    styles.chartTab,
                    chartView === v && styles.chartTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chartTabText,
                      chartView === v && styles.chartTabTextActive,
                    ]}
                  >
                    {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {chartView === 'day' ? (
            chartData.length > 0 ? (
              <View style={styles.chartBarContainer}>
                {chartData.map((item, i) => (
                  <View key={i} style={styles.chartBarItem}>
                    <View style={styles.chartBarOuter}>
                      <View
                        style={[
                          styles.chartBarFill,
                          { height: `${item.height}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartBarLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có dữ liệu tuần từ API.</Text>
              </View>
            )
          ) : chartView === 'week' ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                View &quot;Tuần&quot; đang dùng thẻ &quot;Tổng quan&quot; phía trên.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                View &quot;Tháng&quot; chưa có API. Có thể dùng stats/calendar nếu BE hỗ trợ.
              </Text>
            </View>
          )}
        </View>

        {/* Habits List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách thói quen</Text>

          {habitList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có thói quen nào từ API.</Text>
            </View>
          ) : (
            habitList.map((habit, i) => {
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
                      Math.min(100, Math.round(((currentVal ?? 0) / meta.goal) * 100))
                    )
                  : Math.max(
                      0,
                      Math.min(100, Math.round((currentDays / (goalDays || 1)) * 100))
                    );

              const emoji = (() => {
                const t = (habit.title || '').toLowerCase();
                if (t.includes('uống')) return '💧';
                if (t.includes('đọc') || t.includes('doc')) return '📚';
                if (t.includes('thiền') || t.includes('thien')) return '🧘';
                if (t.includes('đi bộ') || t.includes('di bo')) return '🚶';
                if (t.includes('ngủ') || t.includes('ngu')) return '🛌';
                return '⭐';
              })();

              const progressColor = (() => {
                if (emoji === '💧') return '#10b981';
                if (emoji === '🧘' || emoji === '📚') return '#3b82f6';
                if (emoji === '🚶') return '#2563eb';
                if (emoji === '🛌') return '#6366f1';
                return '#2563eb';
              })();

              let chip = (() => {
                if (status === 'success')
                  return {
                    label: 'Hoàn thành',
                    bg: '#dcfce7',
                    text: '#16a34a',
                  };
                if (status === 'fail')
                  return {
                    label: 'Thất bại',
                    bg: '#fee2e2',
                    text: '#dc2626',
                  };
                if (status === 'skip')
                  return {
                    label: 'Bỏ qua',
                    bg: '#ffedd5',
                    text: '#d97706',
                  };
                return {
                  label: 'Chờ làm',
                  bg: '#e5e7eb',
                  text: '#334155',
                };
              })();

              if (status === 'in_progress') {
                chip = {
                  label: 'Đang làm',
                  bg: '#e0f2fe',
                  text: '#0284c7',
                };
              }

              const isCountHabit = !!unitMap[habit.id];

              return (
                <View key={habit.id} style={{ marginBottom: 10 }}>
                  {/* Habit row */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isCountHabit) {
                        setActiveCountRow(
                          activeCountRow === habit.id ? null : habit.id
                        );
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
                            <View
                              style={[
                                styles.statusChip,
                                { backgroundColor: chip.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  { color: chip.text },
                                ]}
                              >
                                {chip.label}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            setActiveMenu(
                              activeMenu === habit.id ? null : habit.id
                            )
                          }
                          style={styles.moreButton}
                        >
                          <MoreVertical size={18} color="#0f172a" />
                        </TouchableOpacity>
                      </View>

                      {/* Progress header */}
                      <View style={styles.habitProgressHeader}>
                        <Text style={styles.habitProgressLabel}>Tiến độ</Text>
                        <Text style={styles.habitProgressValue}>
                          {meta
                            ? `${currentVal ?? 0}/${meta.goal} ${meta.unit}`
                            : `${currentDays}/${goalDays} ngày`}
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.habitProgressBarOuter}>
                        <View
                          style={[
                            styles.habitProgressBarInner,
                            {
                              width: `${itemPercent}%`,
                              backgroundColor: progressColor,
                            },
                          ]}
                        />
                      </View>
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
                      <TouchableOpacity
                        onPress={() => openEditModal(habit)}
                        style={[styles.actionButton, styles.actionButtonAmberSoft]}
                      >
                        <Pencil size={14} color="#b45309" />
                        <Text style={styles.actionButtonAmberText}>Sửa</Text>
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
                              const val = parseInt(text || '0', 10) || 0;
                              setNewCountForm((prev) => ({
                                ...prev,
                                qty: Math.max(0, val),
                              }));
                            }}
                            style={styles.input}
                          />
                        </View>

                        {/* start */}
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>Bắt đầu *</Text>
                          <TextInput
                            placeholder="HH:MM"
                            value={newCountForm.start}
                            onChangeText={(text) =>
                              setNewCountForm((prev) => ({
                                ...prev,
                                start: text,
                              }))
                            }
                            style={styles.input}
                          />
                        </View>

                        {/* end */}
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>Kết thúc (tùy chọn)</Text>
                          <TextInput
                            placeholder="HH:MM"
                            value={newCountForm.end}
                            onChangeText={(text) =>
                              setNewCountForm((prev) => ({
                                ...prev,
                                end: text,
                              }))
                            }
                            style={styles.input}
                          />
                        </View>
                      </View>

                      {/* note */}
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.formLabel}>Ghi chú</Text>
                        <TextInput
                          value={newCountForm.note}
                          onChangeText={(text) =>
                            setNewCountForm((prev) => ({
                              ...prev,
                              note: text,
                            }))
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
                          style={styles.formSaveButton}
                        >
                          <Text style={styles.formSaveText}>Lưu</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* danh sách count entries (rút gọn UI, vẫn giữ đầy đủ logic) */}
                  {countViewOpen[habit.id] && (
                    <View style={{ marginTop: 8 }}>
                      {(countEntries[habit.id] ?? []).length === 0 ? (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyText}>
                            Chưa có lần nào cho hôm nay. Nhấn &quot;Thêm lần&quot; để bắt đầu.
                          </Text>
                        </View>
                      ) : (
                        (countEntries[habit.id] ?? []).map((en, idx) => {
                          const dur = timeDiff(en.start, en.end);
                          return (
                            <View key={en.id} style={styles.entryBox}>
                              <View style={styles.entryHeaderRow}>
                                <Text style={styles.entryTitle}>
                                  📘 Lần {idx + 1}
                                </Text>
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
                              {en.note ? (
                                <Text style={styles.entryNote}>“{en.note}”</Text>
                              ) : null}

                              <View style={styles.entryButtonRow}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setEditingEntry({
                                      habitId: habit.id,
                                      entryId: en.id,
                                    })
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

                              {/* form sửa entry */}
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
                                        <TextInput
                                          placeholder="HH:MM"
                                          value={en.start || ''}
                                          onChangeText={(text) =>
                                            updateEntry(habit.id, en.id, {
                                              start: text,
                                            })
                                          }
                                          style={styles.input}
                                        />
                                      </View>
                                      <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Kết thúc</Text>
                                        <TextInput
                                          placeholder="HH:MM"
                                          value={en.end || ''}
                                          onChangeText={(text) =>
                                            updateEntry(habit.id, en.id, {
                                              end: text,
                                            })
                                          }
                                          style={styles.input}
                                        />
                                      </View>
                                    </View>

                                    <View style={{ marginTop: 10 }}>
                                      <Text style={styles.formLabel}>Ghi chú</Text>
                                      <TextInput
                                        value={en.note || ''}
                                        onChangeText={(text) =>
                                          updateEntry(habit.id, en.id, {
                                            note: text,
                                          })
                                        }
                                        style={styles.input}
                                      />
                                    </View>

                                    <View style={[styles.rowWrap, { marginTop: 10 }]}>
                                      {(['great', 'good', 'neutral', 'bad'] as const).map(
                                        (f) => {
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
                                        }
                                      )}
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
                        onPress={() => openDetail(habit)}
                        style={[styles.actionButton, styles.actionButtonBlueSoft]}
                      >
                        <Eye size={14} color="#1e40af" />
                        <Text style={styles.actionButtonBlueText}>Xem chi tiết</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openEditModal(habit)}
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
                        <Text style={[styles.flyoutItemText, { color: '#dc2626' }]}>
                          Xóa
                        </Text>
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
                        <Text style={[styles.flyoutItemText, { color: '#2563eb' }]}>
                          Thông tin
                        </Text>
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
            {detailHabitId != null && (() => {
              const h = habitList.find((x) => x.id === detailHabitId)!;
              const status = computedStatus(h.id);
              let chip = (() => {
                if (status === 'success')
                  return { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' };
                if (status === 'fail')
                  return { label: 'Thất bại', color: '#dc2626', bg: '#fee2e2' };
                if (status === 'skip')
                  return { label: 'Bỏ qua', color: '#d97706', bg: '#ffedd5' };
                return { label: 'Chờ làm', color: '#334155', bg: '#e5e7eb' };
              })();
              if (status === 'in_progress') {
                chip = { label: 'Đang làm', color: '#0284c7', bg: '#e0f2fe' };
              }

              const noteVal = notes[h.id] || '';
              const meta = unitMap[h.id];
              const q = meta != null ? (quantities[h.id] ?? meta.current ?? 0) : 0;

              const startVal = timeStart[h.id] ?? '';
              const endVal = timeEnd[h.id] ?? '';

              return (
                <>
                  <View style={styles.detailHeaderRow}>
                    <View style={styles.habitIconBox}>
                      <Text style={{ fontSize: 22 }}>⭐</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.habitTitle}>{h.title}</Text>
                      {!meta && (
                        <View
                          style={[
                            styles.statusChip,
                            { backgroundColor: chip.bg, marginTop: 4 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              { color: chip.color },
                            ]}
                          >
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
                      {/* count-mode: chọn số lượng + thời gian */}
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.formLabel}>Số lượng *</Text>
                        <View style={styles.detailCountRow}>
                          <TouchableOpacity
                            onPress={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [h.id]: Math.max(
                                  0,
                                  (prev[h.id] ?? meta.current ?? 0) - 1
                                ),
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
                                [h.id]: Math.min(
                                  meta.goal,
                                  (prev[h.id] ?? meta.current ?? 0) + 1
                                ),
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
                            <TextInput
                              placeholder="HH:MM"
                              value={startVal}
                              onChangeText={(text) =>
                                setTimeStart((prev) => ({ ...prev, [h.id]: text }))
                              }
                              style={styles.input}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailTimeLabel}>Kết thúc (tùy chọn)</Text>
                            <TextInput
                              placeholder="HH:MM"
                              value={endVal}
                              onChangeText={(text) =>
                                setTimeEnd((prev) => ({ ...prev, [h.id]: text }))
                              }
                              style={styles.input}
                            />
                          </View>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* habit check-mode: chọn trạng thái */}
                      <Text style={[styles.formLabel, { marginTop: 10 }]}>
                        Trạng thái *
                      </Text>
                      <View style={styles.rowWrap}>
                        <TouchableOpacity
                          style={[
                            styles.statusBtn,
                            status === 'in_progress' && styles.statusBtnSelectedBlue,
                          ]}
                          onPress={() => handleStatusChange(h.id, 'in_progress')}
                        >
                          <TrendingUp
                            size={16}
                            color={status === 'in_progress' ? '#0284c7' : '#334155'}
                          />
                          <Text
                            style={[
                              styles.statusBtnText,
                              status === 'in_progress' && { color: '#0284c7' },
                            ]}
                          >
                            Đang làm
                          </Text>
                        </TouchableOpacity>

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
                              style={[
                                styles.statusBtn,
                                selected && { borderColor: opt.color },
                              ]}
                              onPress={() => handleStatusChange(h.id, opt.key)}
                            >
                              {opt.key === 'success' && (
                                <Check size={16} color={opt.color} />
                              )}
                              {opt.key === 'skip' && (
                                <Minus size={16} color={opt.color} />
                              )}
                              {opt.key === 'fail' && <X size={16} color={opt.color} />}
                              <Text
                                style={[
                                  styles.statusBtnText,
                                  selected && { color: opt.color },
                                ]}
                              >
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
                      onChangeText={(text) =>
                        setNotes((prev) => ({ ...prev, [h.id]: text }))
                      }
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
                            <Text
                              style={[
                                styles.moodButtonText,
                                selected && styles.moodButtonTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Buttons */}
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      onPress={closeDetail}
                      style={styles.formCancelButton}
                    >
                      <Text style={styles.formCancelText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const metaLocal = unitMap[h.id];
                        if (metaLocal) {
                          saveCountModal(h.id);
                        } else {
                          syncHabitMeta(h.id);
                        }
                        closeDetail();
                      }}
                      style={styles.formSaveButton}
                    >
                      <Text style={styles.formSaveText}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Modal chỉnh sửa */}
      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chỉnh sửa thói quen</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Tên thói quen"
            />
            <TextInput
              style={styles.input}
              value={editSubtitle}
              onChangeText={setEditSubtitle}
              placeholder="Mô tả / ghi chú"
            />
            <TextInput
              style={styles.input}
              value={editTag}
              onChangeText={setEditTag}
              placeholder="Tag (Mindful, Energy, ...)"
            />
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                onPress={() => editId != null && askDelete(editId, editTitle || '')}
              >
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={closeEditModal}
                  style={styles.formCancelButton}
                >
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
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Xóa thói quen &quot;{confirmName}&quot;?
            </Text>
            <Text style={styles.modalSubText}>
              Hành động này không thể hoàn tác.
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={closeConfirm}
                style={styles.formCancelButton}
              >
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

// ============ STYLES ============
const styles = StyleSheet.create({
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
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
  },
  todayChipText: {
    color: '#4338ca',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  progressCountText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  progressBarOuter: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressFooterRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressGoalText: {
    fontSize: 12,
    color: '#64748b',
  },
  progressPercentText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  chartTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    backgroundColor: '#e2e8f0',
  },
  chartTabActive: {
    backgroundColor: '#2563eb',
  },
  chartTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chartTabTextActive: {
    color: '#fff',
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingVertical: 6,
  },
  chartBarItem: {
    alignItems: 'center',
  },
  chartBarOuter: {
    width: 28,
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
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
  // modal
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
  statusBtnSelectedBlue: {
    borderColor: '#0284c7',
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
