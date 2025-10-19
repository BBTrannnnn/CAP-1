import React, { useState } from 'react';
import { X, ChevronLeft, Check, MoreVertical } from 'lucide-react';
import { Link, Stack } from "expo-router";
export default function CreateHabitDetail() {
  
  const [habitName, setHabitName] = useState('Ăn uống lành mạnh');
  const [selectedIcon, setSelectedIcon] = useState('🏃');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'custom'>('daily');
  const [customFrequency, setCustomFrequency] = useState('3');
  const [repeatType, setRepeatType] = useState<'everyday'|'avoid'>('everyday');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Health']);

  const [actionOpen, setActionOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Dates
  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState<string>('');
  const invalidRange = endDate && new Date(endDate) < new Date(startDate);

  const icons = ['🏃','⭐','🧘','🏋️','📖','📚','🤝','😊','%','✏️','📅','🔥','⚡','🎯','🌙','🎨'];
  const colors = ['#10b981','#f97316','#3b82f6','#ec4899','#6366f1','#ef4444','#22c55e','#f59e0b','#8b5cf6','#9ca3af'];
  const frequencies = [
    { id: 'daily',  label: 'Hằng ngày' },
    { id: 'weekly', label: 'Hằng tuần' },
    { id: 'custom', label: 'Tùy chỉnh' },
  ] as const;
  const repeatTypes = [
    { id: 'everyday', label: 'Làm',   icon: Check },
    { id: 'avoid',    label: 'Tránh', icon: X },
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

  const handleEdit = () => { setActionOpen(false); };
  const handleDelete = () => { setActionOpen(false); setConfirmOpen(true); };

  return (
    <>
    <Stack.Screen options={{ tabBarStyle: { display: 'none' } }} />
    
    <div
      style={{
        width:'100%', maxWidth:420, height:'100vh', margin:'0 auto',
        fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background:'radial-gradient(900px 500px at -10% -20%, #dbeafe 8%, transparent 40%), radial-gradient(800px 450px at 110% 10%, #fce7f3 10%, transparent 45%), linear-gradient(180deg, #f8fafc, #eef2ff)',
        display:'flex', flexDirection:'column', position:'relative'
      }}
    >
      <style>{`
        .glass{background:rgba(255,255,255,.85);border:1px solid rgba(148,163,184,.2);border-radius:16px;box-shadow:0 12px 30px rgba(15,23,42,.06);backdrop-filter:blur(8px)}
        .btn{border:none;border-radius:12px;cursor:pointer;transition:transform .1s,box-shadow .2s,background .2s,opacity .2s}
        .btn:active{transform:translateY(1px) scale(.99)}
        .input{width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;background:linear-gradient(180deg,#fff,#f8fafc);box-sizing:border-box}
        .input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
        .title{font-size:16px;font-weight:800;color:#0f172a;margin:6px 0 12px}
        .subtle{color:#64748b;font-size:12px}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .grid8{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
        .grid10{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}
        .seg{padding:10px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;font-size:13px;font-weight:600;color:#475569}
        .seg.active{border:2px solid #2563eb;background:#eff6ff;color:#2563eb}
        .chip{border-radius:12px;padding:10px;border:1px solid #e5e7eb;background:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;gap:6px}
        .chip.active{background:#f8fafc;box-shadow:inset 0 0 0 2px rgba(0,0,0,.04)}
        .menu{position:absolute;right:44px;top:40px;min-width:140px;overflow:hidden;border-radius:12px;border:1px solid #e5e7eb;background:#fff;box-shadow:0 16px 32px rgba(2,8,23,.12);z-index:10}
        .menu button{width:100%;padding:10px 12px;background:#fff;border:none;text-align:left;font-size:13px}
        .menu button:hover{background:#f1f5f9}
        .overlay{position:fixed;inset:0;background:rgba(15,23,42,.35);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:50}
        .confirm{width:min(92%,420px);border-radius:22px;padding:22px;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,.25)}
        /* === Date input pill (native date, click chắc chắn) === */
        .dateLabel{font-size:10px;color:#64748b;font-weight:700;margin-bottom:4px}
        .datePill{height:28px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;padding:0 10px;font-size:12px;font-weight:800;color:#0f172a;outline:none;width:100%}
        .datePill::-webkit-datetime-edit{padding:0}
        .datePill:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
      `}</style>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:5, padding:12 }}>
        <div className="glass" style={{ padding:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/(tabs)/habits/AddHabitModal">
            <button className="btn" style={{ background:'linear-gradient(180deg,#1d4ed8,#2563eb)', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center' }}>
              <ChevronLeft size={20} color="#fff" />
            </button>
            </Link>
            <div>
              <div style={{ fontSize:18, fontWeight:800 }}>Chi tiết thói quen</div>
              
              <div className="subtle" style={{ color:'#2563eb', fontWeight:700 }}>Quay lại</div>
              
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative',

           
           }}>
            <button onClick={() => setActionOpen(v=>!v)} className="btn"
              style={{ background:'#ffffffcc', border:'1px solid #e5e7eb', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center' }}
              aria-label="Mở menu">
              <MoreVertical size={20} />
            </button>
            <Link href="/(tabs)/habits">
            <button className="btn" style={{ background:'#ffffffcc', border:'1px solid #e5e7eb', width:40, height:40, borderRadius:12, display:'grid', placeItems:'center' }} aria-label="Đóng">
              <X size={18} />
            </button>
            </Link>
            {actionOpen && (
              <div className="menu">
                <button onClick={handleEdit}>Sửa</button>
                <button onClick={handleDelete} style={{ color:'#dc2626' }}>Xóa</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'0 12px 16px',
         overflowX: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE, Edge
       }}>
        <div className="glass" style={{ padding:14, marginBottom:12 }}>
          <div className="title">Tên thói quen</div>
          <input className="input" value={habitName} onChange={e=>setHabitName(e.target.value)} placeholder="VD: Uống 2L nước" />
        </div>

        {/* === Chọn ngày: native input type="date" kiểu pill, rất gọn === */}
        <div className="glass" style={{ padding:12, marginBottom:12 }}>
          <div className="row2" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10}}>
            <div style={{ width:'100%' }}>
              <div className="dateLabel"
              style={{ marginLeft:10 }}
              >Bắt đầu</div>
              <input
                type="date"
                className="datePill"
                value={startDate}
                style={{ width: 'calc(100% - 20px)' }}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (endDate && new Date(endDate) < new Date(v)) setEndDate(v);
                }}
              />
            </div>
            <div style={{ width:'100%' }}>
              <div className="dateLabel"
              style={{ marginLeft:10 }}
              >Kết thúc</div>
              <input
                type="date"
                className="datePill"
                value={endDate}
                min={startDate}
                style={{ width: 'calc(100% - 20px)' }}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {invalidRange && (
            <div style={{ color:'#dc2626', fontSize:11, marginTop:6, fontWeight:700 }}>
              Ngày kết thúc phải ≥ ngày bắt đầu.
            </div>
          )}
        </div>

        {/* Icon */}
       <div
  className="glass"
  style={{
    padding: 14,
    marginTop: 12,
    overflowY: 'auto',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE, Edge
  }}
>
  <style>
    {`
      .glass::-webkit-scrollbar {
        display: none;
      }
    `}
  </style>

  <div className="title">Icon</div>
  <div className="grid8">
    {icons.map((icon, i) => (
      <button
        key={i}
        onClick={() => setSelectedIcon(icon)}
        className="btn"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          fontSize: 20,
          border:
            selectedIcon === icon
              ? `2px solid ${selectedColor}`
              : '1px solid #e5e7eb',
          background:
            selectedIcon === icon ? `${selectedColor}20` : '#fff',
        }}
      >
        {icon}
      </button>
    ))}
  </div>
</div>


        {/* Color */}
        <div className="glass" style={{ padding:14, marginTop:12, 
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE, Edge
        }}>
          <div className="title">Màu sắc</div>
          <div className="grid10">
            {colors.map((color,i)=>(
              <button key={i} onClick={()=>setSelectedColor(color)} className="btn"
                style={{
                  width:34, height:34, borderRadius:'50%',
                  border: selectedColor===color ? '3px solid #0f172a' : '1px solid #d1d5db',
                  background:color
                }} />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="glass" style={{ padding:14, marginTop:12 }}>
          <div className="title">Tần suất</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {frequencies.map(f=>(
              <button key={f.id} onClick={()=>setFrequency(f.id)} className={`seg btn ${frequency===f.id?'active':''}`}>
                {f.label}
              </button>
            ))}
          </div>
          {frequency==='custom' && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
              <input className="input" type="number" value={customFrequency} onChange={e=>setCustomFrequency(e.target.value)} min={1} max={30} style={{ width:88, height:36, padding:'8px 10px' }} />
              <span className="subtle" style={{ fontSize:12 }}>lần/tuần</span>
            </div>
          )}
        </div>

        {/* Repeat type */}
        <div className="glass" style={{ padding:14, marginTop:12 }}>
          <div className="title">Loại thói quen</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {repeatTypes.map(t=>{
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={()=>setRepeatType(t.id)} className={`seg btn ${repeatType===t.id?'active':''}`} style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="glass" style={{ padding:14, marginTop:12 }}>
          <div className="title">Danh mục</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {categories.map(cat=>(
              <button key={cat.id} onClick={()=>toggleCategory(cat.id)}
                className={`chip btn ${selectedCategories.includes(cat.id)?'active':''}`}
                style={{ borderColor: selectedCategories.includes(cat.id)?cat.color:'#e5e7eb', background: selectedCategories.includes(cat.id)? `${cat.color}22` : '#fff' }}>
                <span style={{ fontSize:16 }}>{cat.icon}</span>
                <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="glass" style={{ padding:14, marginTop:12 }}>
          <div className="title">Nhắc nhở</div>
          <button className="btn"
            style={{
              width:'100%', padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'#fff',
              display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, color:'#475569'
            }}>
            <span>Tạo nhắc nhở mới</span><span>→</span>
          </button>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding:12 }}>
        <div className="glass" style={{ padding:10, display:'flex', gap:8 }}>
          <Link href="/(tabs)/habits/AddHabitModal" className="btn" style={{textAlign:'center', flex:1, padding:10, background:'#f1f5f9', borderRadius:12, fontWeight:700, color:'#475569' }}>
            Hủy
          </Link>
          <button
            className="btn"
            disabled={invalidRange}
            style={{
              flex:2, padding:10, background: invalidRange ? '#94a3b8' : '#2563eb',
              color:'#fff', borderRadius:12, fontWeight:800,
              boxShadow: invalidRange ? 'none' : '0 8px 18px rgba(37,99,235,.22)',
              opacity: invalidRange ? .85 : 1
            }}
          >
            Tạo thói quen
          </button>
        </div>
      </div>

      {/* Confirm delete */}
      {confirmOpen && (
        <div className="overlay" onClick={()=>setConfirmOpen(false)}>
          <div className="confirm" onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Xóa thói quen “{habitName}”?</div>
            <div className="subtle" style={{ marginBottom:16 }}>Hành động này không thể hoàn tác.</div>
            <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
              <button className="btn" onClick={()=>setConfirmOpen(false)}
                style={{ background:'#e5e7eb', color:'#0f172a', borderRadius:999, padding:'10px 16px', fontWeight:800 }}>
                Hủy
              </button>
              <button className="btn" onClick={()=>{ setConfirmOpen(false); console.log('Delete habit'); }}
                style={{ background:'#ef4444', color:'#fff', borderRadius:999, padding:'10px 16px', fontWeight:800 }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
