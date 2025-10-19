import React from 'react';
import { Stack,Link } from "expo-router";
import {
  Home, TrendingUp, Moon, Users, User, Plus, BarChart3, ChevronLeft,
  Check, X, Minus, MoreVertical
} from 'lucide-react';

type Habit = {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: 'bg-green-500' | 'bg-orange-500' | 'bg-blue-500';
  duration: string;
};

export default function FlowStateHabits() {
  const [chartView, setChartView] = React.useState<'day'|'week'|'month'>('day');
  const [habitStatus, setHabitStatus] = React.useState<Record<number, 'success'|'fail'|'skip'|undefined>>({});
  const [activeMenu, setActiveMenu] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState<Record<number, string>>({});

  // Danh sách thói quen (để sửa/xóa)
  const initialHabits: Habit[] = React.useMemo(() => ([
    { id: 1, title: 'Thiền 10 phút', subtitle: 'Thiền chính niệm buổi sáng', tag: 'Mindful', tagColor: 'bg-green-500', duration: '12 ngày' },
    { id: 2, title: 'Đi bộ 30 phút', subtitle: 'Đi bộ ngoài trời hoặc treadmill', tag: 'Energy', tagColor: 'bg-orange-500', duration: '8 ngày' },
    { id: 3, title: 'Ngủ đúng giờ', subtitle: 'Đi ngủ trước 23:00', tag: 'Sleep', tagColor: 'bg-blue-500', duration: '16 ngày' },
    { id: 4, title: 'Đọc sách 20 phút', subtitle: 'Đọc sách phát triển bản thân', tag: 'Mindful', tagColor: 'bg-green-500', duration: '5 ngày' },
    { id: 5, title: 'Uống 2L nước', subtitle: 'Uống đủ nước mỗi ngày', tag: 'Energy', tagColor: 'bg-orange-500', duration: '20 ngày' },
    { id: 6, title: 'Viết nhật ký', subtitle: 'Ghi lại suy nghĩ cuối ngày', tag: 'Mindful', tagColor: 'bg-green-500', duration: '3 ngày' }
  ]), []);
  const [habitList, setHabitList] = React.useState<Habit[]>(initialHabits);

  // Modal chỉnh sửa
  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editSubtitle, setEditSubtitle] = React.useState('');
  const [editTag, setEditTag] = React.useState('');

  // Modal xác nhận xóa (riêng, nổi phía trên)
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState('');
  const [confirmId, setConfirmId] = React.useState<number | null>(null);

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

  const getStatusStyle = (status?: 'success'|'fail'|'skip') => {
    if (status === 'success') return { border: '2px solid #10b981', backgroundColor: '#10b981', color: 'white' };
    if (status === 'fail') return { border: '2px solid #ef4444', backgroundColor: '#ef4444', color: 'white' };
    if (status === 'skip') return { border: '2px dashed #94a3b8', backgroundColor: '#94a3b8', color: 'white' };
    return { border: '2px solid #d1d5db', backgroundColor: 'white', color: '#d1d5db' };
  };

  const renderStatusIcon = (status?: 'success'|'fail'|'skip') => {
    if (status === 'success') return <Check size={18} color="white" />;
    if (status === 'fail') return <X size={18} color="white" />;
    if (status === 'skip') return <Minus size={18} color="white" />;
    return null;
  };

  const totalHabits = habitList.length;
  const completedCount = React.useMemo(
    () => habitList.filter(h => habitStatus[h.id] === 'success').length,
    [habitList, habitStatus]
  );
  const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <>
    <Stack.Screen options={{ tabBarStyle: { display: 'none' } }} />
    <div
      style={{
        width: '100%', height: '100vh', overflow: 'auto',
        background:
          'radial-gradient(1200px 600px at 10% -10%, #dbeafe 10%, transparent 40%), radial-gradient(800px 500px at 110% 10%, #fce7f3 10%, transparent 45%), linear-gradient(180deg, #f8fafc, #eef2ff)',
      }}
    >
      {/* CSS nâng cấp UI + modal */}
      <style>{`
        .card { background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(148,163,184,0.18); border-radius: 16px; box-shadow: 0 10px 25px rgba(15,23,42,0.06); }
        .btn { border: none; border-radius: 12px; cursor: pointer; transition: transform .12s ease, box-shadow .2s ease, background .2s ease; }
        .btn:active { transform: translateY(1px) scale(0.99); }
        .icon-btn { width: 40px; height: 40px; border-radius: 50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 6px 16px rgba(37, 99, 235, .25); }

        .progress-rail { width: 100%; height: 10px; border-radius: 999px; overflow: hidden; background: linear-gradient(90deg, #e5e7eb, #f1f5f9); }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #34d399, #22c55e); border-radius: 999px; transition: width .35s ease; box-shadow: 0 6px 14px rgba(34,197,94,.35) inset; }

        @keyframes growUp { from { transform: translateY(12px) scaleY(0.6); opacity: .2; } to { transform: translateY(0) scaleY(1); opacity: 1; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .bar { border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, #86efac, #4ade80); box-shadow: 0 6px 16px rgba(74, 222, 128, .35); transition: transform .15s ease, box-shadow .2s ease, opacity .2s ease; animation: growUp .45s ease forwards; }
        .bar:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(74, 222, 128, .5); }
        .chart-enter { animation: fadeSlide .35s ease; }

        .month-grid { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: 8px; align-items: end; }
        .month-cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }

        .habit-item { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid rgba(203,213,225,.4); border-radius:14px; transition: background .2s, box-shadow .2s, transform .12s; position: relative; }
        .habit-item:hover { box-shadow: 0 10px 22px rgba(15,23,42,.06); transform: translateY(-1px); background: linear-gradient(180deg, rgba(248,250,252,.7), rgba(255,255,255,.9)); }
        .status-dot { width: 34px; height: 34px; border-radius: 50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: all .2s; }
        .glow-success { box-shadow: 0 0 0 4px rgba(16,185,129,.12), 0 10px 20px rgba(16,185,129,.25); }
        .glow-fail   { box-shadow: 0 0 0 4px rgba(239,68,68,.12), 0 10px 20px rgba(239,68,68,.25); }

        .tag { padding: 3px 10px; border-radius: 999px; font-weight: 600; font-size: 11px; color: white; box-shadow: 0 6px 16px rgba(0,0,0,.1); }
        .mini-menu { background: linear-gradient(180deg, #f8fafc, #ffffff); border: 1px solid rgba(203,213,225,.5); border-radius: 12px; padding: 10px; }

        .skip-btn { background: repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 8px, #f1f5f9 8px, #f1f5f9 16px); color: #334155; font-weight: 700; border: 2px dashed #94a3b8; }
        .skip-btn:hover { opacity: .95; }

        .pill { display:inline-flex; align-items:center; gap:8px; background: linear-gradient(180deg, #eef2ff, #e0e7ff); color:#4338ca; padding:6px 10px; border-radius:999px; font-weight:600; font-size:12px; border: 1px solid rgba(99,102,241,.25) }

        .bottom-nav { position:fixed; left:0; right:0; bottom:0; background: rgba(255,255,255,.8); backdrop-filter: blur(10px); border-top:1px solid rgba(203,213,225,.6); display:flex; justify-content:space-around; padding:12px 0; z-index:10 }
        .nav-btn { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition: transform .12s ease, opacity .2s ease; }
        .nav-btn:active { transform: translateY(1px) scale(.98); }

        .dot-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(203,213,225,.7); background: #ffffffaa; display:flex; align-items:center; justify-content:center; }

        /* Modal chung */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; animation: fadeSlide .2s ease; }
        .modal-card {
          width: min(92%, 440px);
          background: white; border-radius: 20px;
          box-shadow: 0 30px 60px rgba(15,23,42,.25);
          border: 1px solid rgba(203,213,225,.6);
          padding: 18px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .modal-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .modal-input { width: 100%; padding: 10px 12px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; background: linear-gradient(180deg, #ffffff, #f8fafc); box-sizing: border-box; }
        .modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .link-danger { color: #dc2626; background: none; border: none; cursor: pointer; font-weight: 700; }
        .btn-ghost { background: #e2e8f0; border: none; border-radius: 12px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
        .btn-primary { background: #2563eb; color: white; border: none; border-radius: 12px; padding: 8px 14px; font-weight: 700; cursor: pointer; }

        /* Modal xác nhận xóa (nổi cao hơn) */
        .confirm-overlay { z-index: 60; }
        .confirm-card { width: min(92%, 420px); padding: 22px; border-radius: 24px; }
        .confirm-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .confirm-sub { font-size: 14px; color: #64748b; margin-bottom: 16px; }
        .confirm-actions { display:flex; justify-content:center; gap:12px; }
        .btn-cancel { background:#e5e7eb; color:#0f172a; border:none; border-radius:999px; padding:10px 16px; font-weight:700; cursor:pointer; }
        .btn-danger { background:#ef4444; color:#fff; border:none; border-radius:999px; padding:10px 16px; font-weight:700; cursor:pointer; }

        /* Chống tràn chữ dài */
        .ellipsis-wrap { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
        {/* Header */}
        <div className="card" style={{ position: 'sticky', top: 0, zIndex: 10, padding: 14, margin: '10px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="btn icon-btn" style={{ background: 'linear-gradient(180deg, #1d4ed8, #2563eb)' }}>
              <ChevronLeft size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: .2 }}>Flow State Habits</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Theo dõi thói quen hằng ngày</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/(tabs)/habits/AddHabitModal">
            <button className="btn icon-btn" style={{ background: 'linear-gradient(180deg, #1d4ed8, #2563eb)', color: 'white' }}>
              <Plus size={20} />
            </button>
            </Link>
            <Link href="/(tabs)/habits/HabitStreak">
            <button className="btn icon-btn" style={{ background: 'linear-gradient(180deg, #e2e8f0, #f8fafc)' }}>
              <BarChart3 size={20} color="#0f172a" />
            </button>
            </Link>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="card" style={{ padding: 16, margin: '12px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="pill">
              <TrendingUp size={16} />
              Tiến độ hôm nay
            </span>
            <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
              {completedCount}/{totalHabits} hoàn thành
            </span>
          </div>
          <div className="progress-rail">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Mục tiêu: hoàn thành tất cả</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{progressPercent}%</span>
          </div>
        </div>

        {/* Chart Section */}
        <div className="card" style={{ padding: 16, margin: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Biểu đồ tiến bộ</span>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {['day', 'week', 'month'].map(v => (
                <button
                  key={v}
                  onClick={() => setChartView(v as any)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    background: chartView === v ? 'linear-gradient(180deg, #1d4ed8, #2563eb)' : 'linear-gradient(180deg, #e2e8f0, #f8fafc)',
                    color: chartView === v ? 'white' : '#334155',
                    fontSize: 12, fontWeight: 700, border: '1px solid rgba(99,102,241,.15)'
                  }}
                >
                  {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>

          <div key={chartView} className="chart-enter">
            {chartView !== 'month' ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: 8, overflow: 'hidden', padding: '6px 2px' }}>
                {getChartData().map((item, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 44 }}>
                    <div className="bar" title={`${item.day}: ${item.height}`} style={{ width: 28, height: item.height }} />
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{item.day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="month-grid" style={{ height: 160, padding: '6px 2px' }}>
                {getChartData().map((item, index) => (
                  <div key={index} className="month-cell">
                    <div className="bar" title={`${item.day}: ${item.height}`} style={{ width: '100%', maxWidth: 26, height: item.height, margin: '0 auto' }} />
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{item.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Habits List */}
        <div className="card" style={{ padding: 16, margin: '12px 10px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Danh sách thói quen</div>

          {habitList.map((habit) => {
            const status = habitStatus[habit.id];
            const bgTag =
              habit.tagColor === 'bg-green-500' ? '#10b981' :
              habit.tagColor === 'bg-orange-500' ? '#f97316' : '#3b82f6';

            return (
              <div key={habit.id} style={{ marginBottom: 10 }}>
                <div
                  onClick={() => setActiveMenu(activeMenu === habit.id ? null : habit.id)}
                  className="habit-item"
                  style={{
                    background:
                      status === 'success'
                        ? 'linear-gradient(180deg, #f0fdf4, #ffffff)'
                        : status === 'fail'
                        ? 'linear-gradient(180deg, #fef2f2, #ffffff)'
                        : 'linear-gradient(180deg, rgba(248,250,252,.7), rgba(255,255,255,.9))'
                  }}
                >
                  <div
                    className={[
                      'status-dot',
                      status === 'success' ? 'glow-success' : '',
                      status === 'fail' ? 'glow-fail' : ''
                    ].join(' ')}
                    style={{ ...getStatusStyle(status) }}
                  >
                    {renderStatusIcon(status)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="ellipsis-wrap" style={{ fontSize: 15, fontWeight: 700 }}>{habit.title}</span>
                      <span className="tag" style={{ background: bgTag }}>{habit.tag}</span>
                    </div>
                    <div className="ellipsis-wrap" style={{ fontSize: 13, color: '#64748b' }}>{habit.subtitle}</div>
                  </div>

                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 8 }}>{habit.duration}</span>

                  {/* Nút 3 chấm mở modal chỉnh sửa */}
                  <button
                    className="dot-btn"
                    onClick={(e) => { e.stopPropagation(); openEditModal(habit); }}
                    title="Chỉnh sửa thói quen"
                  >
                    <MoreVertical size={18} color="#0f172a" />
                  </button>
                </div>

                {/* Mini Menu trạng thái & ghi chú */}
                {activeMenu === habit.id && (
                  <div className="mini-menu" style={{ margin: '8px 0 6px 46px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <button
                        onClick={() => handleStatusChange(habit.id, 'success')}
                        className="btn"
                        style={{ flex: 1, background: 'linear-gradient(180deg, #10b981, #059669)', color: 'white', fontSize: 13, fontWeight: 700, padding: '8px 10px' }}
                        title="Đánh dấu Hoàn thành – sẽ tính vào % tiến độ hôm nay"
                      >
                        Hoàn thành
                      </button>
                      <button
                        onClick={() => handleStatusChange(habit.id, 'fail')}
                        className="btn"
                        style={{ flex: 1, background: 'linear-gradient(180deg, #ef4444, #dc2626)', color: 'white', fontSize: 13, fontWeight: 700, padding: '8px 10px' }}
                        title="Đánh dấu Thất bại – không tính vào % tiến độ"
                      >
                        Thất bại
                      </button>
                      <button
                        onClick={() => handleStatusChange(habit.id, 'skip')}
                        className="btn skip-btn"
                        style={{ flex: 1, fontSize: 13, padding: '8px 10px' }}
                        title="Bỏ qua – không tính vào % tiến độ hôm nay"
                      >
                        Bỏ qua
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                      * Bỏ qua: trung lập cho ngày hôm nay, <b>không cộng cũng không trừ</b> vào tiến độ.
                    </div>
                    <textarea
                      placeholder="Ghi chú..."
                      value={notes[habit.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [habit.id]: e.target.value })}
                      style={{ width: '100%', fontSize: 13, padding: 10, borderRadius: 10, border: '1px solid rgba(203,213,225,.9)', background: 'linear-gradient(180deg, #ffffff, #f8fafc)', resize: 'none' }}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        {[
          { icon: Home, label: 'Trang chủ', active: false },
          { icon: TrendingUp, label: 'Thói quen', active: true },
          { icon: Moon, label: 'Giấc ngủ', active: false },
          { icon: Users, label: 'Cộng đồng', active: false },
          { icon: User, label: 'Cá nhân', active: false }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={index} className="nav-btn" style={{ color: item.active ? '#2563eb' : '#94a3b8' }}>
              <Icon size={22} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODAL chỉnh sửa */}
      {editOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-title">Chỉnh sửa thói quen</div>
            <input className="modal-input" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} placeholder="Tên thói quen" />
            <input className="modal-input" value={editSubtitle} onChange={(e)=>setEditSubtitle(e.target.value)} placeholder="Mô tả / ghi chú" />
            <input className="modal-input" value={editTag} onChange={(e)=>setEditTag(e.target.value)} placeholder="Tag (Mindful, Energy, ...)" />
            <div className="modal-actions">
              <button className="link-danger" onClick={()=> editId!=null && askDelete(editId, editTitle || '')}>Xóa</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={closeEditModal}>Hủy</button>
                <button className="btn-primary" onClick={saveEdit}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL xác nhận xóa (đẹp, cân giữa) */}
      {confirmOpen && (
        <div className="modal-overlay confirm-overlay" onClick={closeConfirm}>
          <div className="modal-card confirm-card" onClick={(e)=>e.stopPropagation()}>
            <div className="confirm-title">Xóa thói quen “{confirmName}”?</div>
            <div className="confirm-sub">Hành động này không thể hoàn tác.</div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={closeConfirm}>Hủy</button>
              <button className="btn-danger" onClick={()=> confirmId!=null && deleteHabit(confirmId)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
