import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import '../../styles/FlowStateHabits.css';
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

  // helper để dùng cho cả load weeklyBars & update lại bar hôm nay
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
        console.log('[Habits.index] getHabits API:', res);
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
        console.log('[Habits.index] getTodayOverview API:', ovr);
        console.log('[Habits.index] getWeeklyReport API:', report);

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

        // Load tracking hôm nay (status + note + mood) cho mỗi habit
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

        // Load count từ subtrackings hôm nay
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

  // Refresh when the screen regains focus (after create/update/delete)
  useFocusEffect(
    useCallback(() => {
      setRefreshFlag((x) => x + 1);
    }, [])
  );

  const addCountEntry = (habitId: number) => {
    (async () => {
      try {

        const bid = n2b[habitId];
        if (!bid) {
          setCountEntries((prev) => {
            const arr = prev[habitId] ?? [];
            const nextId = arr.length ? Math.max(...arr.map((e) => e.id)) + 1 : 1;
            const meta = unitMap[habitId];
            const startVal = timeStart[habitId] ?? '';
            const endVal = timeEnd[habitId] ?? '';
            const newEntry: CountEntry = {
              id: nextId,
              qty: meta ? Math.max(1, quantities[habitId] ?? meta.current) : 1,
              start: startVal,
              end: endVal,
            };
            getCurrentCountValue(habitId)
            return { ...prev, [habitId]: [...arr, newEntry] };
          });
          setCountViewOpen((v) => ({ ...v, [habitId]: true }));
          getCurrentCountValue(habitId)
          return;
        }
        const meta = unitMap[habitId];
        const qty = meta ? Math.max(1, quantities[habitId] ?? meta.current) : 1;
        const startVal = timeStart[habitId] ?? hhmmNow();
        const endVal = timeEnd[habitId] || undefined;
        const body: any = { quantity: qty, date: todayStr(), startTime: startVal , mood: moods[habitId]};
        if (endVal) body.endTime = endVal;
        await apiAddHabitSubTracking(bid, body);
        getCurrentCountValue(habitId)
        toggleCountView(habitId)
        toggleCountView(habitId)
        setCountViewOpen((v) => ({ ...v, [habitId]: true }));
        refreshAll();
      } catch (err) {
        console.error('[habits.index] add subtrack error:', err);
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
          toggleCountView(habitId)
          toggleCountView(habitId)
        }
      } catch (err) {
        console.error('[habits.index] delete subtrack error:', err);
      } finally {
        // No local sync; rely on refresh
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
        // No local sync; rely on refresh
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
        // No local sync; rely on refresh
        if (activeMenu === id) setActiveMenu(null);
        closeConfirm();
        if (editOpen) closeEditModal();
      }
    })();
  };

  // dữ liệu biểu đồ
  const getChartData = () => {
    if (chartView === 'day') {
      return weeklyBars ?? [];
    }
    return [];
  };

  // gửi status + note + date + mood khi đổi trạng thái
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

  // sync khi bấm Xong (habit thường)
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

  // ✅ tổng số habit dựa trên FE (cho progress luôn realtime)
  const totalHabits = habitList.length || overview?.totalHabits || 0;

  // ✅ số habit hoàn thành tính từ state FE, không phụ thuộc overview nữa
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
  }, [habitList, habitStatus, countEntries, quantities]);

  // ✅ phần trăm tiến độ cũng lấy từ FE
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

  // Lưu count-mode trong modal
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

  const chartData = getChartData();

  // ✅ mỗi khi progressPercent thay đổi, cập nhật lại cột của "ngày hôm nay" trong weeklyBars
  useEffect(() => {
    if (!weeklyBars || weeklyBars.length === 0) return;
    if (totalHabits <= 0) return;

    const todayLabel = labelFor(new Date());
    const newHeight = progressPercent; // cho ngày hiện tại

    setWeeklyBars((prev) => {
      if (!prev) return prev;
      return prev.map((bar) =>
        bar.day === todayLabel ? { ...bar, height: newHeight } : bar
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent, totalHabits]);

  return (
    <div
      className="fsh-page"
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '96px',
      }}
    >
      {/* Header */}
      <div
        className="fsh-card fsh-header-card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid rgba(203,213,225,0.6)',
          margin: '10px',
          marginTop: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 12px rgba(15,23,42,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '0.2px',
                color: '#0f172a',
                margin: 0,
              }}
            >
              Flow State Habits
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Theo dõi thói quen hằng ngày
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/(tabs)/habits/AddHabitModal')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={20} color="#fff" />
          </button>
          <button
            onClick={() => {
              router.push('/(tabs)/habits/HabitStreak')}}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <BarChart3 size={20} color="#0f172a" />
          </button>
          <button
            onClick={() => router.push('/(tabs)/habits/HabitSurvey')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Target size={20} color="#0f172a" />
          </button>
         
        </div>
      </div>

      {/* Progress Summary */}
      <div
        className="fsh-card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid rgba(203,213,225,0.6)',
          padding: '16px',
          margin: '0 10px',
          marginTop: '8px',
          boxShadow: '0 8px 12px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e0e7ff',
              padding: '6px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            <TrendingUp size={16} color="#4338ca" />
            <span style={{ color: '#4338ca', fontWeight: '700', fontSize: '12px' }}>
              Tiến độ hôm nay
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '700' }}>
            {completedCount}/{totalHabits} hoàn thành
          </span>
        </div>

        <div className="fsh-progress" style={{ marginTop: '6px' }}>
          <div className="fsh-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>Mục tiêu: hoàn thành tất cả</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div
        className="fsh-card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid rgba(203,213,225,0.6)',
          padding: '16px',
          margin: '0 10px',
          marginTop: '12px',
          boxShadow: '0 8px 12px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#0f172a',
              margin: 0,
            }}
          >
            Biểu đồ tiến bộ
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(99,102,241,0.15)',
                  backgroundColor: chartView === v ? '#2563eb' : '#e2e8f0',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: chartView === v ? '#fff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
        </div>

        {chartView === 'day' ? (
          (chartData.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '140px',
                gap: '8px',
                padding: '6px 0',
              }}
            >
              {chartData.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '36px',
                    gap: '6px',
                  }}
                >
                  <div
                    className="fsh-bar"
                    style={{ width: '28px', borderRadius: '8px', height: item.height }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: '600',
                    }}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          )) || (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px dashed #cbd5e1',
                fontSize: 13,
                color: '#64748b',
              }}
            >
              Chưa có dữ liệu tuần từ API.
            </div>
          )
        ) : chartView === 'week' ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            View &quot;Tuần&quot; đang dùng thẻ &quot;Tổng quan&quot; phía trên.
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            View &quot;Tháng&quot; chưa có API. Có thể dùng stats/calendar nếu BE hỗ trợ.
          </div>
        )}
      </div>

      {/* Habits List */}
      <div
        className="fsh-card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid rgba(203,213,225,0.6)',
          padding: '16px',
          margin: '0 10px',
          marginTop: '12px',
          boxShadow: '0 8px 12px rgba(15,23,42,0.08)',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: '800',
            marginBottom: '12px',
            color: '#0f172a',
          }}
        >
          Danh sách thói quen
        </h2>

        {habitList.length === 0 ? (
          <div
            style={{
              padding: 12,
              border: '1px dashed #cbd5e1',
              borderRadius: 12,
              color: '#64748b',
              fontSize: 13,
            }}
          >
            Không có thói quen nào từ API.
          </div>
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

            const noteText = (notes[habit.id] || '').trim();
            const moodKey = moods[habit.id];
            const moodMeta = (() => {
              switch (moodKey) {
                case 'great':
                  return {
                    emoji: '😊',
                    label: 'Tuyệt vời',
                    bg: '#dcfce7',
                    text: '#16a34a',
                    border: 'rgba(34,197,94,0.25)',
                  };
                case 'good':
                  return {
                    emoji: '🙂',
                    label: 'Tốt',
                    bg: '#dbeafe',
                    text: '#2563eb',
                    border: 'rgba(37,99,235,0.25)',
                  };
                case 'neutral':
                  return {
                    emoji: '😐',
                    label: 'Bình thường',
                    bg: '#f3f4f6',
                    text: '#374151',
                    border: 'rgba(148,163,184,0.35)',
                  };
                case 'bad':
                  return {
                    emoji: '😞',
                    label: 'Không tốt',
                    bg: '#fee2e2',
                    text: '#dc2626',
                    border: 'rgba(239,68,68,0.25)',
                  };
                default:
                  return undefined;
              }
            })();

            let chip = (() => {
              if (status === 'success')
                return {
                  label: 'Hoàn thành',
                  bg: '#dcfce7',
                  text: '#16a34a',
                  border: 'rgba(34,197,94,0.25)',
                  icon: 'check' as const,
                };
              if (status === 'fail')
                return {
                  label: 'Thất bại',
                  bg: '#fee2e2',
                  text: '#dc2626',
                  border: 'rgba(239,68,68,0.25)',
                  icon: 'x' as const,
                };
              if (status === 'skip')
                return {
                  label: 'Bỏ qua',
                  bg: '#ffedd5',
                  text: '#d97706',
                  border: 'rgba(245,158,11,0.25)',
                  icon: 'minus' as const,
                };
              return {
                label: 'Chờ làm',
                bg: '#e5e7eb',
                text: '#334155',
                border: 'rgba(148,163,184,0.35)',
                icon: 'clock' as const,
              };
            })();

            if (status === 'in_progress') {
              chip = {
                label: 'Đang làm',
                bg: '#e0f2fe',
                text: '#0284c7',
                border: 'rgba(2,132,199,0.25)',
                icon: 'clock' as const,
              };
            }

            return (
              <div
                key={habit.id}
                className="fsh-fade-in"
                style={{
                  marginBottom: '10px',
                  position: 'relative',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div
                  onClick={() => {
                    if (meta) {
                      setActiveCountRow(activeCountRow === habit.id ? null : habit.id);
                    } else {
                      setActiveRow(activeRow === habit.id ? null : habit.id);
                    }
                  }}
                  className="fsh-habit"
                  style={{
                    width: '100%',
                    border: '1px solid rgba(203,213,225,0.4)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor:
                      status === 'success'
                        ? '#f0fdf4'
                        : status === 'fail'
                        ? '#fef2f2'
                        : status === 'in_progress'
                        ? '#e0f2fe'
                        : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    {/* Top row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div
                          className="fsh-habit-icon"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
                          }}
                        >
                          <span style={{ fontSize: '22px' }}>{emoji}</span>
                        </div>
                        <div>
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: '#0f172a',
                              margin: 0,
                              marginBottom: '4px',
                            }}
                          >
                            {habit.title}
                          </h3>
                          <div
                            className="fsh-chip"
                            data-status={status || 'none'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: chip.bg,
                              padding: '4px 8px',
                              borderRadius: '999px',
                              border: `1px solid ${chip.border}`,
                            }}
                          >
                            {chip.icon === 'check' && <Check size={12} color={chip.text} />}
                            {chip.icon === 'x' && <X size={12} color={chip.text} />}
                            {chip.icon === 'minus' && <Minus size={12} color={chip.text} />}
                            {chip.icon === 'clock' && <Clock size={12} color={chip.text} />}
                            <span
                              style={{
                                color: chip.text,
                                fontWeight: 700,
                                fontSize: '12px',
                              }}
                            >
                              {chip.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === habit.id ? null : habit.id);
                        }}
                        className="fsh-icon-btn"
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          border: '1px solid rgba(203,213,225,0.7)',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreVertical size={18} color="#0f172a" />
                      </button>
                    </div>

                    {/* Progress header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        Tiến độ
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#0f172a',
                          fontWeight: 800,
                        }}
                      >
                        {meta
                          ? `${currentVal ?? 0}/${meta.goal} ${meta.unit}`
                          : `${currentDays}/${goalDays} ngày`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        backgroundColor: '#e5e7eb',
                        marginTop: '6px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: progressColor,
                          width: `${itemPercent}%`,
                          transition: 'width 0.3s ease',
                          borderRadius: '999px',
                        }}
                      />
                    </div>

                    {/* Note preview */}
                    {noteText && (
                      <div
                        style={{
                          marginTop: '10px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '8px 10px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            fontWeight: 700,
                            marginBottom: '4px',
                          }}
                        >
                          Ghi chú
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#334155',
                          }}
                        >
                          {noteText}
                        </div>
                      </div>
                    )}

                    {/* mood preview */}
                    {moodMeta && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: noteText ? '8px' : '10px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            fontWeight: 700,
                          }}
                        >
                          Cảm giác
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 8px',
                            borderRadius: 999,
                            backgroundColor: moodMeta.bg,
                            border: `1px solid ${moodMeta.border}`,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{moodMeta.emoji}</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: moodMeta.text,
                            }}
                          >
                            {moodMeta.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action row count-mode */}
                {meta && activeCountRow === habit.id && (
                  <>
                    <div
                      className="fsh-action-row"
                      style={{
                        paddingTop: 8,
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      <button
                        onClick={() => toggleCountView(habit.id)}
                        style={{
                          flex: '1 1 140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          background: '#eef2ff',
                          border: '1px solid #c7d2fe',
                          borderRadius: 999,
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: '#1e40af',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} color="#1e40af" />
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => addCountEntry(habit.id)}
                        style={{
                          flex: '1 1 140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: 999,
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: '#047857',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} color="#047857" />
                        Thêm lần
                      </button>
                      <button
                        onClick={() => clearCountDay(habit.id)}
                        style={{
                          flex: '1 1 140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: 999,
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} color="#dc2626" />
                        Xóa ngày
                      </button>
                      <button
                        onClick={() => openEditModal(habit)}
                        style={{
                          flex: '1 1 140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: 999,
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: '#b45309',
                          cursor: 'pointer',
                        }}
                      >
                        <Pencil size={14} color="#b45309" />
                        Sửa
                      </button>
                    </div>

                    {countViewOpen[habit.id] && (
                      <div style={{ marginTop: 10 }}>
                        {(countEntries[habit.id] ?? []).length === 0 ? (
                          <div
                            style={{
                              padding: 12,
                              border: '1px dashed #cbd5e1',
                              borderRadius: 12,
                              color: '#64748b',
                              fontSize: 13,
                            }}
                          >
                            Chưa có lần nào cho hôm nay. Nhấn &quot;Thêm lần&quot; để bắt đầu.
                          </div>
                        ) : (
                          (countEntries[habit.id] ?? []).map((en, idx) => {
                            console.log(countEntries[habit.id]);
                            
                            const dur = timeDiff(en.start, en.end);
                            const moodMetaEn = (() => {
                              switch (en.mood) {
                                case 'great':
                                  return {
                                    emoji: '😊',
                                    label: 'Tuyệt vời',
                                    color: '#16a34a',
                                    bg: '#dcfce7',
                                    border: 'rgba(34,197,94,0.25)',
                                  };
                                case 'good':
                                  return {
                                    emoji: '🙂',
                                    label: 'Tốt',
                                    color: '#2563eb',
                                    bg: '#dbeafe',
                                    border: 'rgba(37,99,235,0.25)',
                                  };
                                case 'neutral':
                                  return {
                                    emoji: '😐',
                                    label: 'Bình thường',
                                    color: '#374151',
                                    bg: '#f3f4f6',
                                    border: 'rgba(148,163,184,0.35)',
                                  };
                                case 'bad':
                                  return {
                                    emoji: '😞',
                                    label: 'Không tốt',
                                    color: '#dc2626',
                                    bg: '#fee2e2',
                                    border: 'rgba(239,68,68,0.25)',
                                  };
                                default:
                                  return undefined;
                              }
                            })();

                            const metaLocal = unitMap[habit.id];

                            const tonePalette = [
                              { bg: '#ecfeff', border: '#a5f3fc' },
                              { bg: '#eff6ff', border: '#bfdbfe' },
                              { bg: '#f5f3ff', border: '#c4b5fd' },
                              { bg: '#f0fdf4', border: '#bbf7d0' },
                              { bg: '#fffbeb', border: '#fde68a' },
                              { bg: '#fef2f2', border: '#fecaca' },
                            ];

                            const toneByTag = (() => {
                              const t = String(habit.tag || '').toLowerCase();
                              if (t === 'mindful') return { bg: '#f0fdf4', border: '#bbf7d0' };
                              if (t === 'energy') return { bg: '#fff7ed', border: '#fed7aa' };
                              if (t === 'sleep') return { bg: '#eff6ff', border: '#bfdbfe' };
                              return { bg: '#f8fafc', border: '#e2e8f0' };
                            })();

                            const entryTone = (() => {
                              if (moodMetaEn)
                                return {
                                  bg: moodMetaEn.bg,
                                  border: moodMetaEn.border,
                                };
                              if (habit.tag) return toneByTag;
                              return tonePalette[idx % tonePalette.length];
                            })();

                            const accentColor = (() => {
                              const t = String(habit.tag || '').toLowerCase();
                              if (t === 'mindful') return '#22c55e';
                              if (t === 'energy') return '#f59e0b';
                              if (t === 'sleep') return '#3b82f6';
                              return '#94a3b8';
                            })();

                            return (
                              <div
                                key={en.id}
                                style={{
                                  background: entryTone.bg,
                                  border: `1px solid ${entryTone.border}`,
                                  borderLeft: `6px solid ${accentColor}`,
                                  borderRadius: 12,
                                  padding: 12,
                                  marginTop: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    position: 'relative',
                                  }}
                                >
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: 8,
                                      top: 10,
                                      width: 8,
                                      height: 8,
                                      borderRadius: 999,
                                      background: accentColor,
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: '#0f172a',
                                    }}
                                  >
                                    📘 Lần {idx + 1}
                                  </div>
                                  {en.start && en.end && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: '#0f172a',
                                        background: '#f3f4f6',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 999,
                                        padding: '4px 8px',
                                      }}
                                    >
                                      {en.start} - {en.end}
                                      {dur ? ` (${dur} phút)` : ''}
                                    </div>
                                  )}
                                </div>

                                <div style={{ marginTop: 6 }}>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 800,
                                      color: '#2563eb',
                                    }}
                                  >
                                    {en.qty} {metaLocal?.unit || ''}
                                  </div>
                                  {en.note && (
                                    <div
                                      style={{
                                        marginTop: 4,
                                        fontStyle: 'italic',
                                        color: '#475569',
                                      }}
                                    >
                                      “{en.note}”
                                    </div>
                                  )}
                                  {moodMetaEn && (
                                    <div
                                      style={{
                                        marginTop: 4,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        background: moodMetaEn.bg,
                                        border: `1px solid ${moodMetaEn.border}`,
                                        borderRadius: 999,
                                        padding: '4px 8px',
                                      }}
                                    >
                                      <span>{moodMetaEn.emoji}</span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: moodMetaEn.color,
                                        }}
                                      >
                                        {moodMetaEn.label}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                  <button
                                    onClick={() =>
                                      setEditingEntry({
                                        habitId: habit.id,
                                        entryId: en.id,
                                      })
                                    }
                                    style={{
                                      background: '#fffbeb',
                                      border: '1px solid #fde68a',
                                      color: '#b45309',
                                      fontWeight: 800,
                                      borderRadius: 10,
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Pencil size={14} color="#b45309" /> Sửa
                                  </button>
                                  <button
                                    onClick={() => deleteCountEntry(habit.id, en.id)}
                                    style={{
                                      background: '#fee2e2',
                                      border: '1px solid #fecaca',
                                      color: '#dc2626',
                                      fontWeight: 800,
                                      borderRadius: 10,
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Trash2 size={14} color="#dc2626" /> Xóa
                                  </button>
                                </div>

                                {editingEntry &&
                                  editingEntry.habitId === habit.id &&
                                  editingEntry.entryId === en.id && (
                                    <div
                                      style={{
                                        marginTop: 10,
                                        background: '#f8fafc',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 12,
                                        padding: 12,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          gap: 10,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <div style={{ flex: '1 1 120px' }}>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: '#64748b',
                                              marginBottom: 4,
                                            }}
                                          >
                                            Số lượng
                                          </div>
                                          <input
                                            type="number"
                                            min={0}
                                            value={en.qty}
                                            onChange={(e) =>
                                              updateEntry(habit.id, en.id, {
                                                qty: Math.max(
                                                  0,
                                                  parseInt(e.target.value || '0', 10)
                                                ),
                                              })
                                            }
                                            style={{
                                              width: 'calc(100% - 20px)',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: 10,
                                              padding: 8,
                                            }}
                                          />
                                        </div>
                                        <div style={{ flex: '1 1 120px' }}>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: '#64748b',
                                              marginBottom: 4,
                                            }}
                                          >
                                            Bắt đầu
                                          </div>
                                          <input
                                            type="time"
                                            value={en.start || ''}
                                            onChange={(e) =>
                                              updateEntry(habit.id, en.id, {
                                                start: e.target.value,
                                              })
                                            }
                                            style={{
                                              width: 'calc(100% - 20px)',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: 10,
                                              padding: 8,
                                            }}
                                          />
                                        </div>
                                        <div style={{ flex: '1 1 120px' }}>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: '#64748b',
                                              marginBottom: 4,
                                            }}
                                          >
                                            Kết thúc
                                          </div>
                                          <input
                                            type="time"
                                            value={en.end || ''}
                                            onChange={(e) =>
                                              updateEntry(habit.id, en.id, {
                                                end: e.target.value,
                                              })
                                            }
                                            style={{
                                              width: 'calc(100% - 20px)',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: 10,
                                              padding: 8,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div style={{ marginTop: 10 }}>
                                        <div
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#64748b',
                                            marginBottom: 4,
                                          }}
                                        >
                                          Ghi chú
                                        </div>
                                        <input
                                          type="text"
                                          value={en.note || ''}
                                          onChange={(e) =>
                                            updateEntry(habit.id, en.id, {
                                              note: e.target.value,
                                            })
                                          }
                                          style={{
                                            width: 'calc(100% - 20px)',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 10,
                                            padding: 8,
                                          }}
                                        />
                                      </div>
                                      <div
                                        style={{
                                          marginTop: 10,
                                          display: 'flex',
                                          gap: 8,
                                          flexWrap: 'wrap',
                                        }}
                                      >
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
                                              <button
                                                key={f}
                                                onClick={() =>
                                                  updateEntry(habit.id, en.id, {
                                                    mood: selected ? undefined : f,
                                                  })
                                                }
                                                style={{
                                                  padding: '6px 10px',
                                                  borderRadius: 999,
                                                  border: `2px solid ${
                                                    selected ? '#2563eb' : '#e5e7eb'
                                                  }`,
                                                  background: '#fff',
                                                  cursor: 'pointer',
                                                  fontWeight: 700,
                                                  color: selected ? '#2563eb' : '#334155',
                                                }}
                                              >
                                                {label}
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'flex-end',
                                          gap: 8,
                                          marginTop: 10,
                                        }}
                                      >
                                        <button
                                          onClick={() => setEditingEntry(null)}
                                          style={{
                                            background: '#e5e7eb',
                                            border: '1px solid #cbd5e1',
                                            color: '#0f172a',
                                            fontWeight: 800,
                                            borderRadius: 10,
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={() => saveEntry(habit.id, en.id)}
                                          style={{
                                            background: '#2563eb',
                                            border: '1px solid #2563eb',
                                            color: '#fff',
                                            fontWeight: 800,
                                            borderRadius: 10,
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Lưu
                                        </button>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Action row habit thường */}
                {!meta && activeRow === habit.id && (
                  <div className="fsh-action-row">
                    <button
                      onClick={() => openDetail(habit)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: 999,
                        padding: '10px 12px',
                        fontWeight: 800,
                        color: '#1e40af',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={14} color="#1e40af" />
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => openEditModal(habit)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 999,
                        padding: '10px 12px',
                        fontWeight: 800,
                        color: '#b45309',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} color="#b45309" />
                      Sửa
                    </button>
                    <button
                      onClick={() => askDelete(habit.id, habit.title)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: 999,
                        padding: '10px 12px',
                        fontWeight: 800,
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} color="#dc2626" />
                      Xóa
                    </button>
                  </div>
                )}

                {/* Flyout menu */}
                {activeMenu === habit.id && (
                  <div
                    className="fsh-card fsh-fly"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 16,
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(203,213,225,0.7)',
                      borderRadius: 12,
                      boxShadow: '0 8px 16px rgba(15,23,42,0.15)',
                      padding: 6,
                      zIndex: 20,
                      minWidth: 160,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(null);
                        openEditModal(habit);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(null);
                        askDelete(habit.id, habit.title);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Xóa
                    </button>
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(null);
                      const bid = n2b[habit.id];
                      if (bid) {
                        router.push({ pathname: '/(tabs)/habits/RunningHabitTracker', params: { habitId: bid } });
                      } else {
                        router.push('/(tabs)/habits/RunningHabitTracker');
                      }
                    }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Thông tin
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal chi tiết */}
      {detailOpen && detailHabitId != null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeDetail}
        >
          <div
            style={{
              width: '92%',
              maxWidth: 520,
              backgroundColor: '#fff',
              borderRadius: 20,
              border: '1px solid rgba(203,213,225,0.6)',
              padding: 18,
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const h = habitList.find((x) => x.id === detailHabitId)!;
              const status = computedStatus(h.id);
              let chip = (() => {
                if (status === 'success')
                  return { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' };
                if (status === 'fail') return { label: 'Thất bại', color: '#dc2626', bg: '#fee2e2' };
                if (status === 'skip') return { label: 'Bỏ qua', color: '#d97706', bg: '#ffedd5' };
                return { label: 'Chờ làm', color: '#334155', bg: '#e5e7eb' };
              })();
              if (status === 'in_progress') {
                chip = { label: 'Đang làm', color: '#0284c7', bg: '#e0f2fe' };
              }

              const noteVal = notes[h.id] || '';
              const meta = unitMap[h.id];
              const q = meta != null ? (quantities[h.id] ?? meta.current ?? 0) : 0;

              const onDec = () =>
                meta &&
                setQuantities((prev) => ({
                  ...prev,
                  [h.id]: Math.max(0, (prev[h.id] ?? meta.current) - 1),
                }));
              const onInc = () =>
                meta &&
                setQuantities((prev) => ({
                  ...prev,
                  [h.id]: Math.min(meta.goal, (prev[h.id] ?? meta.current) + 1),
                }));

              const startVal = timeStart[h.id] ?? '';
              const endVal = timeEnd[h.id] ?? '';

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>⭐</span>
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#0f172a',
                        }}
                      >
                        {h.title}
                      </h3>
                      {!meta && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 8px',
                            borderRadius: 999,
                            backgroundColor: chip.bg,
                            border: '1px solid rgba(148,163,184,0.35)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: chip.color,
                            }}
                          >
                            Chế độ: {chip.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        marginLeft: 'auto',
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      {meta ? `${q}/${meta.goal} ${meta.unit}` : ''}
                    </div>
                  </div>

                  {meta ? (
                    <>
                      <div style={{ marginTop: 6 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: 8,
                          }}
                        >
                          Số lượng *
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                          }}
                        >
                          <button
                            onClick={onDec}
                            aria-label="Giảm"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              border: '1px solid #e5e7eb',
                              background: '#f3f4f6',
                              cursor: 'pointer',
                              fontSize: 18,
                              fontWeight: 800,
                              color: '#111827',
                            }}
                          >
                            -
                          </button>
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                fontSize: 42,
                                fontWeight: 800,
                                color: '#0f172a',
                                lineHeight: 1,
                              }}
                            >
                              {q}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#64748b',
                                fontWeight: 700,
                              }}
                            >
                              {meta.unit}
                            </div>
                          </div>
                          <button
                            onClick={onInc}
                            aria-label="Tăng"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              border: '1px solid #10b981',
                              background: '#10b981',
                              cursor: 'pointer',
                              fontSize: 20,
                              fontWeight: 800,
                              color: '#fff',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Thời gian thực hiện */}
                      <div
                        style={{
                          marginTop: 14,
                          background: '#f8fafc',
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          <Clock size={14} color="#0f172a" />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#0f172a',
                            }}
                          >
                            Thời gian thực hiện *
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#64748b',
                                fontWeight: 700,
                                marginBottom: 6,
                              }}
                            >
                              Bắt đầu *
                            </div>
                            <div
                              style={{
                                border: '2px solid #e5e7eb',
                                borderRadius: 12,
                                padding: 8,
                                background: '#fff',
                              }}
                            >
                              <input
                                type="time"
                                value={startVal}
                                onChange={(e) =>
                                  setTimeStart({
                                    ...timeStart,
                                    [h.id]: e.target.value,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  border: 'none',
                                  outline: 'none',
                                  fontWeight: 800,
                                  fontSize: 14,
                                  color: '#0f172a',
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#64748b',
                                fontWeight: 700,
                                marginBottom: 6,
                              }}
                            >
                              Kết thúc (tùy chọn)
                            </div>
                            <div
                              style={{
                                border: '2px solid #111827',
                                borderRadius: 12,
                                padding: 8,
                                background: '#fff',
                              }}
                            >
                              <input
                                type="time"
                                value={endVal}
                                onChange={(e) =>
                                  setTimeEnd({
                                    ...timeEnd,
                                    [h.id]: e.target.value,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  border: 'none',
                                  outline: 'none',
                                  fontWeight: 800,
                                  fontSize: 14,
                                  color: '#0f172a',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: 8,
                        }}
                      >
                        Trạng thái *
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleStatusChange(h.id, 'in_progress')}
                          style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 12,
                            cursor: 'pointer',
                            background: '#fff',
                            border: `2px solid ${
                              status === 'in_progress' ? '#0284c7' : '#e5e7eb'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <TrendingUp
                            size={16}
                            color={status === 'in_progress' ? '#0284c7' : '#334155'}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: status === 'in_progress' ? '#0284c7' : '#334155',
                            }}
                          >
                            Đang làm
                          </span>
                        </button>
                        {(
                          [
                            { key: 'success', label: 'Hoàn thành', color: '#16a34a' },
                            { key: 'skip', label: 'Bỏ qua', color: '#d97706' },
                            { key: 'fail', label: 'Thất bại', color: '#dc2626' },
                          ] as const
                        ).map((opt) => {
                          const selected = status === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleStatusChange(h.id, opt.key)}
                              style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 12,
                                cursor: 'pointer',
                                background: '#fff',
                                border: `2px solid ${selected ? opt.color : '#e5e7eb'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                              }}
                            >
                              {opt.key === 'success' && <Check size={16} color={opt.color} />}
                              {opt.key === 'skip' && <Minus size={16} color={opt.color} />}
                              {opt.key === 'fail' && <X size={16} color={opt.color} />}
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: selected ? opt.color : '#334155',
                                }}
                              >
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ghi chú */}
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0f172a',
                        marginBottom: 8,
                      }}
                    >
                      Ghi chú
                    </div>
                    <textarea
                      placeholder="Thêm ghi chú về buổi thực hiện..."
                      value={noteVal}
                      maxLength={200}
                      onChange={(e) => setNotes({ ...notes, [h.id]: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid rgba(203,213,225,0.9)',
                        borderRadius: 12,
                        backgroundColor: '#fff',
                        padding: 12,
                        fontSize: 13,
                        minHeight: 90,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 12,
                        color: '#94a3b8',
                        marginTop: 6,
                      }}
                    >
                      {noteVal.length}/200 ký tự
                    </div>
                  </div>

                  {/* Cảm giác */}
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0f172a',
                        marginBottom: 8,
                      }}
                    >
                      Cảm giác
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
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
                          <button
                            key={opt.key}
                            onClick={() =>
                              setmoods({
                                ...moods,
                                [h.id]: selected ? undefined : opt.key,
                              })
                            }
                            style={{
                              flexBasis: '48%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              padding: 12,
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: '#fff',
                              border: `2px solid ${selected ? '#2563eb' : '#e5e7eb'}`,
                            }}
                          >
                            <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: selected ? '#2563eb' : '#334155',
                              }}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      marginTop: 16,
                    }}
                  >
                    <button
                      onClick={closeDetail}
                      style={{
                        background: '#e5e7eb',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: 12,
                        padding: '8px 14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        const metaLocal = unitMap[h.id];
                        if (metaLocal) {
                          // count-mode
                          saveCountModal(h.id);
                        } else {
                          // habit check: lưu status + note + mood + date
                          syncHabitMeta(h.id);
                        }
                        closeDetail();
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '8px 14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Xong
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa */}
      {editOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              width: '92%',
              maxWidth: '440px',
              backgroundColor: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(203,213,225,0.6)',
              padding: '18px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '12px',
                marginTop: 0,
              }}
            >
              Chỉnh sửa thói quen
            </h2>

            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#fff',
                marginBottom: '10px',
                boxSizing: 'border-box',
              }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Tên thói quen"
            />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#fff',
                marginBottom: '10px',
                boxSizing: 'border-box',
              }}
              value={editSubtitle}
              onChange={(e) => setEditSubtitle(e.target.value)}
              placeholder="Mô tả / ghi chú"
            />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#fff',
                marginBottom: '10px',
                boxSizing: 'border-box',
              }}
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              placeholder="Tag (Mindful, Energy, ...)"
            />

            <div
              style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => editId != null && askDelete(editId, editTitle || '')}
                style={{
                  color: '#dc2626',
                  fontWeight: '700',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Xóa
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={closeEditModal}
                  style={{
                    backgroundColor: '#e2e8f0',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontWeight: '700',
                    color: '#0f172a',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    backgroundColor: '#2563eb',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {confirmOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeConfirm}
        >
          <div
            style={{
              width: '92%',
              maxWidth: '440px',
              backgroundColor: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(203,213,225,0.6)',
              padding: '22px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '6px',
                marginTop: 0,
              }}
            >
              Xóa thói quen &quot;{confirmName}&quot;?
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              Hành động này không thể hoàn tác.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <button
                onClick={closeConfirm}
                style={{
                  backgroundColor: '#e5e7eb',
                  borderRadius: '999px',
                  padding: '10px 16px',
                  color: '#0f172a',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => confirmId != null && deleteHabit(confirmId)}
                style={{
                  backgroundColor: '#ef4444',
                  borderRadius: '999px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="footer" style={{ height: '10vh' }} />
    </div>
  );
}
