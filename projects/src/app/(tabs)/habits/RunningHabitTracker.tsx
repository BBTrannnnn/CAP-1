// app/(tabs)/habits/RunningHabitTracker.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
import {
  getHabitReminders,
  createHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  getHabitGoals,
  createHabitGoal,
  updateHabitGoal,
  deleteHabitGoal,
  getHabitStats,
} from '../../../server/habits';
import './RunningHabitTracker.css';

type Reminder = {
  id: string;
  time: string;
  days: boolean[];
  enabled: boolean;
  note?: string;
};

type Challenge = {
  id: string;
  title: string;
  goal: number;
  current: number;
  icon: string;
  note: string;
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
  const [name,setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Challenge | null>(null);
  const [newGoal, setNewGoal] = useState<Challenge>({
    id: Date.now().toString(),
    title: '',
    goal: 30,
    current: 0,
    icon: '🏃‍♂️',
    note: '',
  });

  // Custom confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // ====== HELPERS MAP DỮ LIỆU API → UI ======
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
        // mảng số index (0-6)
        days = days.map((_, i) => rawDays.includes(i));
      }
    }

    const enabled: boolean = r.enabled ?? r.isActive ?? true;
    const note: string = r.note ?? r.description ?? '';

    return { id, time, days, enabled, note };
  };

  const normalizeGoal = (g: any): Challenge => {
    const id = String(g.id ?? g._id ?? Date.now());
    const title: string = g.title ?? g.name ?? 'Mục tiêu';
    const goal: number = Number(
      g.goal ??
      g.target ??
      g.targetDays ??
      30
    ) || 0;
    const current: number = Number(
      g.current ??
      g.progress ??
      g.completedDays ??
      0
    ) || 0;
    const icon: string = g.icon ?? '🎯';
    const note: string = g.note ?? g.description ?? '';

    return { id, title, goal, current, icon, note };
  };

  // ====== LOAD DATA TỪ API ======
  useEffect(() => {
    if (!habitId) return;

    let cancelled = false;

    const loadReminders = async () => {
      try {
        const res: any = await getHabitReminders(habitId as string);
        console.log('[RunningHabitTracker] getHabitReminders API:', res);
        const list: any[] = res?.reminders ?? res?.data ?? res ?? [];
        if (!cancelled) {
          setReminders(list.map(normalizeReminder));
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitReminders error:', e);
      }
    };

    const loadGoals = async () => {
      try {
        const res: any = await getHabitGoals(habitId as string, 'active');
        console.log('[RunningHabitTracker] getHabitGoals API:', res);
        const list: any[] = res?.goals ?? res?.data ?? res ?? [];
        if (!cancelled) {
          setChallenges(list.map(normalizeGoal));
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitGoals error:', e);
      }
    };

    const loadStats = async () => {
      try {
        const res: any = await getHabitStats(habitId as string, {});
        console.log('[RunningHabitTracker] getHabitStats API:', res);
        const name = res?.data.habit.name;
        const frequency = res?.data.habit.frequency;
        const setfre = () => {
          switch (frequency) {
            case 'daily':
              return 'HÀNG NGÀY';
            case 'weekly':
              return 'HÀNG TUẦN';
            case 'monthly':
              return 'HÀNG THÁNG';
            default:
              return 'HÀNG NGÀY';
          }
        }
        setName(name);
        setFrequency(setfre()
        );
        const s = res?.data ?? res ?? {};
        const completed = Number(s.stats.completedCount ?? s.stats.completed ?? 0) || 0;
        const failed = Number(s.stats.failedCount ?? s.stats.failed ?? 0) || 0;
        const skipped = Number(s.stats.skippedCount ?? s.stats.skipped ?? 0) || 0;
        const total = Number(s.stats.totalCount ?? s.stats.total ?? completed + failed + skipped) || 0;

        const currentStreak =
          Number(s.streaks.current?? 0) || 0;
        const bestStreak =
          Number(s.streaks.best ?? s.longestStreak ?? currentStreak) || 0;

        let successRate = 0;
        if (Number.isFinite(s.successRate)) {
          successRate = Number(s.successRate);
        } else if (total > 0) {
          successRate = (completed / total) * 100;
        }

        if (!cancelled) {
          setHabitStats({
            currentStreak,
            bestStreak,
            successRate: Math.round(successRate),
          });
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitStats error:', e);
      }
    };

    loadReminders();
    loadGoals();
    loadStats();

    return () => {
      cancelled = true;
    };
  }, [habitId]);

  const refetchAll = React.useCallback(async () => {
    if (!habitId) return;
    try {
      const [r, g, s]: any[] = await Promise.all([
        getHabitReminders(habitId as string),
        getHabitGoals(habitId as string, 'active'),
        getHabitStats(habitId as string, {}),
      ]);
      const rlist: any[] = r?.reminders ?? r?.data ?? r ?? [];
      setReminders(rlist.map(normalizeReminder));
      const glist: any[] = g?.goals ?? g?.data ?? g ?? [];
      setChallenges(glist.map(normalizeGoal));
      const sdata = s?.stats ?? s ?? {};
      const completed = Number(sdata.completedCount ?? sdata.completed ?? 0) || 0;
      const failed = Number(sdata.failedCount ?? sdata.failed ?? 0) || 0;
      const skipped = Number(sdata.skippedCount ?? sdata.skipped ?? 0) || 0;
      const total = Number(sdata.totalCount ?? sdata.total ?? completed + failed + skipped) || 0;
      const currentStreak = Number(sdata.currentStreak ?? sdata.streak ?? 0) || 0;
      const bestStreak = Number(sdata.bestStreak ?? sdata.longestStreak ?? currentStreak) || 0;
      let successRate = 0;
      if (Number.isFinite(sdata.successRate)) successRate = Number(sdata.successRate);
      else if (total > 0) successRate = (completed / total) * 100;
      setHabitStats({ currentStreak, bestStreak, successRate: Math.round(successRate) });
    } catch (e) {
      console.error('[HabitTracker] refetchAll error:', e);
    }
  }, [habitId]);

  // ====== UPDATE FIELD LOCAL ======
  const updateReminderField = useCallback((field: keyof Reminder, value: any) => {
    setNewReminder(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateGoalField = useCallback((field: keyof Challenge, value: any) => {
    setNewGoal(prev => ({ ...prev, [field]: value }));
  }, []);

  const openConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
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
      const payload: any = {
        time: newReminder.time,
        days: newReminder.days,
        enabled: newReminder.enabled,
        note: newReminder.note,
      };

      if (habitId) {
        if (editingReminder) { await updateHabitReminder(habitId as string, editingReminder.id, payload);          await refetchAll();        } else {          await createHabitReminder(habitId as string, payload);          await refetchAll();        }
      } else {
        // fallback local (nếu chưa có habitId)
        if (editingReminder) {await updateHabitReminder(habitId as string, editingReminder.id, payload);          await refetchAll();        } else {          await createHabitReminder(habitId as string, payload);          await refetchAll();        };
        }
      }
    catch (e) {
      console.error('[HabitTracker] saveReminder error:', e);
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
        const payload: any = {
          time: updated.time,
          days: updated.days,
          enabled: updated.enabled,
          note: updated.note,
        };
        await updateHabitReminder(habitId as string, id, payload);        await refetchAll();
      } catch (e) {
        console.error('[HabitTracker] toggleReminderEnabled error:', e);
      }
    }
  };

  // ====== SAVE / DELETE GOAL (API) ======
  const resetGoalForm = () => {
    setEditingGoal(null);
    setNewGoal({
      id: Date.now().toString(),
      title: '',
      goal: 30,
      current: 0,
      icon: '🏃‍♂️',
      note: '',
    });
  };

  const handleSaveGoal = async () => {
    try {
      if (!habitId) {
        // fallback local nếu chưa có habitId
        if (editingGoal) {
          setChallenges(challenges.map(c => (c.id === editingGoal.id ? newGoal : c)));
        } else {
          setChallenges([...challenges, { ...newGoal, id: Date.now().toString() }]);
        }
        return;
      }

      const isUpdate = !!editingGoal;

      if (isUpdate) {
        const payload: any = {
          // BE allows: target, unit, description, deadline, reward, current
          target: Number(newGoal.goal) || undefined,
          current: Number(newGoal.current) || undefined,
          description: newGoal.title || undefined,
          reward: newGoal.note || undefined,
          // unit optional; add a sensible default if you want
        };
        await updateHabitGoal(habitId as string, editingGoal!.id, payload);        await refetchAll();
      } else {
        const payload: any = {
          // BE requires: type and target
          type: 'total_completions',
          target: Math.max(1, Number(newGoal.goal) || 1),
          description: newGoal.title || '',
          reward: newGoal.note || '',
          // unit optional
        };
        await createHabitGoal(habitId as string, payload);        await refetchAll();
      }
    } catch (e) {
      console.error('[HabitTracker] saveGoal error:', e);
    } finally {
      setShowGoalModal(false);
      resetGoalForm();
    }
  };

  // ====== UI COMPONENTS CON ======
  const StatCards: React.FC<{ stats: HabitStats }> = ({ stats }) => (
    <div className="rt-stat-cards">
      <div className="rt-stat-card rt-stat-card--rose">
        <div className="rt-stat-card-circle" />
        <Flame size={24} color="#f43f5e" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <div className="rt-stat-number">{stats.currentStreak}</div>
        <div className="rt-stat-sub">Streak hiện tại</div>
      </div>
      <div className="rt-stat-card rt-stat-card--amber">
        <div className="rt-stat-card-circle" />
        <Award size={24} color="#d97706" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <div className="rt-stat-number">{stats.bestStreak}</div>
        <div className="rt-stat-sub">Kỷ lục cao nhất</div>
      </div>
      <div className="rt-stat-card rt-stat-card--teal">
        <div className="rt-stat-card-circle" />
        <TrendingUp size={24} color="#0d9488" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <div className="rt-stat-number">{Math.round(stats.successRate)}%</div>
        <div className="rt-stat-sub">Tỷ lệ thành công</div>
      </div>
    </div>
  );

  const ReminderList = () => (
    <div className="rt-list">
      {reminders.map((r) => (
        <div key={r.id} className="rt-card">
          <div className="rt-card-head">
            <div className="rt-card-left">
              <div className={`rt-icon-box ${r.enabled ? 'is-on' : 'is-off'}`}>
                <Bell color="#fff" size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="rt-time">{r.time}</div>
                <div className={`rt-status ${r.enabled ? 'is-on' : 'is-off'}`}>
                  {r.enabled ? 'Đang hoạt động' : 'Đã tạm dừng'}
                </div>
              </div>
            </div>
            <div className="rt-card-actions">
              <button
                onClick={() => {
                  setEditingReminder(r);
                  setNewReminder(r);
                  setShowReminderModal(true);
                }}
                className="rt-icon-action rt-icon-action-edit"
              >
                <Edit2 color="#8b5cf6" size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() =>
                  openConfirm('Bạn có chắc muốn xóa nhắc nhở này?', async () => {
                    if (habitId) {
                      try {
                        await deleteHabitReminder(habitId as string, r.id);
                      } catch (e) {
                        console.error('[HabitTracker] deleteReminder error:', e);
                      }
                    }
                    await refetchAll();
                  })
                }
                className="rt-icon-action rt-icon-action-delete"
              >
                <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="rt-card-body">
            <div>
              <div className="rt-section-label">Lặp lại theo ngày</div>
              <div className="rt-day-row">
                {r.days.map((a, i) => (
                  <div key={i} className={`rt-day ${a ? 'is-active' : ''}`}>
                    {dayNames[i]}
                  </div>
                ))}
              </div>
            </div>

            {r.note && r.note.trim().length > 0 && (
              <div>
                <div className="rt-goal-note">{r.note}</div>
              </div>
            )}

            <div className="rt-card-footer">
              <div className="rt-section-label">Trạng thái thông báo</div>
              <button
                onClick={() => toggleReminderEnabled(r.id)}
                className={`rt-toggle ${r.enabled ? 'is-on' : ''}`}
              >
                <div className="rt-toggle-knob">
                  {r.enabled && <Check size={14} color="#7c3aed" strokeWidth={3} />}
                </div>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const GoalList = () => (
    <div className="rt-list">
      {challenges.map((c) => {
        const progress = c.goal > 0 ? Math.max(0, Math.min(100, (c.current / c.goal) * 100)) : 0;
        return (
          <div key={c.id} className="rt-card rt-goal-card">
            <div className="rt-card-head">
              <div className="rt-card-left">
                <div className="rt-emoji">{c.icon}</div>
                <div>
                  <div className="rt-goal-title">{c.title}</div>
                  <div className="rt-goal-note">{c.note}</div>
                </div>
              </div>
              <div className="rt-card-actions">
                <button
                  onClick={() => {
                    setEditingGoal(c);
                    setNewGoal(c);
                    setShowGoalModal(true);
                  }}
                  className="rt-icon-action rt-icon-action-edit"
                >
                  <Edit2 color="#d946ef" size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() =>
                    openConfirm('Bạn có muốn xóa mục tiêu này?', async () => {
                      if (habitId) {
                        try {
                          await deleteHabitGoal(habitId as string, c.id);
                        } catch (e) {
                          console.error('[HabitTracker] deleteGoal error:', e);
                        }
                      }
                      setChallenges(prev => prev.filter(x => x.id !== c.id));
                    })
                  }
                  className="rt-icon-action rt-icon-action-delete"
                >
                  <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="rt-card-body">
              <div className="rt-progress-head">
                <div className="rt-section-label">Tiến độ hoàn thành</div>
                <div className="rt-progress-percent">{Math.round(progress)}%</div>
              </div>
              <div className="rt-progress">
                <div className="rt-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="rt-progress-foot">
                <div className="rt-goal-completed">Đã hoàn thành</div>
                <div className="rt-goal-count">
                  <span className="rt-accent">{c.current}</span> / {c.goal} ngày
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const ModalSheet: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({
    onClose,
    title,
    children,
  }) => (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div
        className="rt-modal"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rt-modal-header">
          <div className="rt-modal-title">{title}</div>
        </div>
        <div className="rt-modal-body">{children}</div>
      </div>
    </div>
  );

  // ====== UI ======
  return (
    <div className="rt-page">
      <div className="rt-topbar">
        <div className="rt-topbar-inner">
          <div className="rt-header-row">
            <button
              onClick={() => router.push('/(tabs)/habits')}
              className="rt-back-btn"
              style={{ marginRight: 8 }}
              aria-label="Quay lại"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="rt-app-badge">
              <Target color="#fff" size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="rt-app-title">FlowState</div>
              <div className="rt-app-subtitle">Habit Tracking System</div>
            </div>
          </div>
          <div className="rt-tabs">
            {(['info', 'reminders', 'goals'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`rt-tab ${activeTab === t ? 'is-active' : ''}`}
              >
                {t === 'info' ? 'Tổng quan' : t === 'reminders' ? 'Nhắc nhở' : 'Mục tiêu'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rt-content">
        {activeTab === 'info' && (
          <>
            <div className="rt-section-title">Tổng quan</div>
            <div className="rt-hero">
              <div className="rt-hero-inner">
                <div className="rt-hero-eyebrow">THÓI QUEN {frequency}</div>
                <div className="rt-hero-title">{name}</div>
                <div className="rt-hero-subtitle">Gieo nhịp từng bước - Kỷ luật {frequency}</div>
                <div className="rt-hero-stats">
                  <div className="rt-hero-stat">
                    <div className="rt-hero-stat-label">Tần suất</div>
                    <div className="rt-hero-stat-value">{frequency}</div>
                  </div>
                  <div className="rt-hero-stat">
                    <div className="rt-hero-stat-label">Mục tiêu</div>
                    <div className="rt-hero-stat-value">{name}</div>
                  </div>
                </div>
              </div>
            </div>

            <StatCards stats={habitStats} />
          </>
        )}

        {activeTab === 'reminders' && (
          <>
            <div className="rt-section-head">
              <button onClick={() => setActiveTab('info')} className="rt-back-btn">
                <ChevronLeft size={18} strokeWidth={2.5} />
                Quay lại
              </button>
              <div className="rt-section-title">Nhắc nhở</div>
              <button
                onClick={() => {
                  setEditingReminder(null);
                  resetReminderForm();
                  setShowReminderModal(true);
                }}
                className="rt-icon-btn rt-icon-btn-violet"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            <ReminderList />
          </>
        )}

        {activeTab === 'goals' && (
          <>
            <div className="rt-section-head">
              <button onClick={() => setActiveTab('info')} className="rt-back-btn">
                <ChevronLeft size={18} strokeWidth={2.5} />
                Quay lại
              </button>
              <div className="rt-section-title">Mục tiêu</div>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  resetGoalForm();
                  setShowGoalModal(true);
                }}
                className="rt-icon-btn rt-icon-btn-pink"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            <GoalList />
          </>
        )}
      </div>

      {showReminderModal && (
        <ModalSheet
          onClose={() => {
            setShowReminderModal(false);
            setEditingReminder(null);
          }}
          title={editingReminder ? 'Chỉnh sửa nhắc nhở' : 'Thêm nhắc nhở mới'}
        >
          <div className="rt-form">
            <div>
              <label className="rt-label">Thời gian</label>
              <input
                type="time"
                defaultValue={newReminder.time}
                onBlur={(e) => updateReminderField('time', e.target.value)}
                className="rt-input rt-input-time"
              />
            </div>
            <div>
              <label className="rt-label">Lặp lại theo ngày</label>
              <div className="rt-day-grid">
                {dayNames.map((d, i) => {
                  const active = newReminder.days[i];
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const ds = [...newReminder.days];
                        ds[i] = !ds[i];
                        updateReminderField('days', ds);
                      }}
                      className={`rt-day rt-day--square ${active ? 'is-active' : ''}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="rt-label">Ghi chú</label>
              <textarea
                defaultValue={newReminder.note || ''}
                onBlur={(e) => updateReminderField('note', e.target.value)}
                className="rt-textarea"
                placeholder="Thêm ghi chú cho nhắc nhở..."
              />
            </div>
            <div className="rt-form-actions">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                }}
                className="rt-btn-outline"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveReminder}
                className="rt-btn-solid rt-btn-solid-violet"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </ModalSheet>
      )}

      {showGoalModal && (
        <ModalSheet
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          title={editingGoal ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
        >
          <div className="rt-form">
            <div>
              <label className="rt-label">Tiêu đề</label>
              <input
                type="text"
                defaultValue={newGoal.title}
                onBlur={(e) => updateGoalField('title', e.target.value)}
                className="rt-input"
                placeholder="VD: Thử thách 30 ngày"
              />
            </div>
            <div>
              <label className="rt-label">Biểu tượng</label>
              <div className="rt-emoji-grid">
                {GOAL_EMOJIS.map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    className={`rt-emoji-cell ${newGoal.icon === emo ? 'is-selected' : ''}`}
                    onClick={() => updateGoalField('icon', emo)}
                    aria-label={`Chọn ${emo}`}
                  >
                    <span>{emo}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rt-form-grid">
              <div>
                <label className="rt-label">Mục tiêu (ngày)</label>
                <input
                  type="number"
                  defaultValue={String(newGoal.goal)}
                  onBlur={(e) =>
                    updateGoalField('goal', parseInt(e.target.value, 10) || 0)
                  }
                  className="rt-input"
                />
              </div>
              <div>
                <label className="rt-label">Hiện tại</label>
                <input
                  type="number"
                  defaultValue={String(newGoal.current)}
                  onBlur={(e) =>
                    updateGoalField('current', parseInt(e.target.value, 10) || 0)
                  }
                  className="rt-input"
                />
              </div>
            </div>
            <div>
              <label className="rt-label">Ghi chú</label>
              <textarea
                defaultValue={newGoal.note || ''}
                onBlur={(e) => updateGoalField('note', e.target.value)}
                className="rt-textarea"
                placeholder="Thêm mô tả cho mục tiêu của bạn..."
              />
            </div>
            <div className="rt-form-actions">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setEditingGoal(null);
                }}
                className="rt-btn-outline"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveGoal}
                className="rt-btn-solid rt-btn-solid-pink"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </ModalSheet>
      )}

      {confirmOpen && (
        <ModalSheet
          onClose={() => {
            setConfirmOpen(false);
            setConfirmAction(null);
          }}
          title="Xác nhận"
        >
          <div className="rt-form">
            <div className="rt-confirm-message">{confirmMessage}</div>
            <div className="rt-form-actions">
              <button
                className="rt-btn-outline"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmAction(null);
                }}
              >
                Hủy
              </button>
              <button
                className="rt-btn-solid rt-btn-solid-pink"
                onClick={() => {
                  if (confirmAction) confirmAction();
                  setConfirmOpen(false);
                  setConfirmAction(null);
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </ModalSheet>
      )}
    </div>
  );
};

export default HabitTracker;





