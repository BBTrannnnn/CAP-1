import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Check } from 'lucide-react-native';
import '../../styles/FlowStateHabits.css';
import './HabitSurvey.css';
import { createHabit } from '../../../server/habits';

type Suggestion = {
  id: string;
  name: string;
  title: string;
  description: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  time: string; // ví dụ: "10 phút/ngày"
  category: 'mindful' | 'energy' | 'sleep' | 'productivity' | 'social' | 'personal';
  score: number; // điểm phù hợp 0-100
};

const parseAnswers = (raw?: string): Record<string, string> => {
  if (!raw) return {};
  try { return JSON.parse(decodeURIComponent(raw)); } catch { return {}; }
};

export default function HabitSuggestions() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const answers = useMemo(() => parseAnswers(data), [data]);

  // 4 miền điểm: tinh thần, thể chất, xã hội, cá nhân
  const domainScores = useMemo(() => {
    const s = { mental: 60, physical: 60, social: 60, personal: 60 };
    // Một số quy tắc đơn giản lấy từ answers
    const activity = answers['activity_level'];
    if (activity === 'very_low') s.physical -= 10; else if (activity === 'high') s.physical += 10;
    const sleep = answers['sleep_quality'];
    if (sleep === 'poor') s.personal -= 15; else if (sleep === 'great') s.personal += 10;
    const stress = answers['stress'];
    if (stress === 'high' || stress === 'very_high') s.mental -= 15;
    if (answers['reading'] === 'yes' || answers['reading'] === 'yes_more') s.personal += 5;
    if (answers['meditation'] && answers['meditation'] !== 'no') s.mental += 5;
    if (answers['breaks'] === 'never') s.social -= 5; else if (answers['breaks'] === 'often') s.social += 5;
    // Clamp
    const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
    return {
      mental: clamp(s.mental),
      physical: clamp(s.physical),
      social: clamp(s.social),
      personal: clamp(s.personal),
    };
  }, [answers]);
  const [bas,setBase] = useState<Suggestion[]>([]);
  const suggested: Suggestion[] = useMemo(() => {
    // Chọn gợi ý theo điểm thấp hơn
    const lowAreas: Array<'mental'|'physical'|'social'|'personal'> = Object.entries(domainScores)
      .sort((a,b) => a[1]-b[1])
      .map(([k]) => k as any);
    const suggestion = sessionStorage.getItem("suggestion");
    console.log(JSON.parse(suggestion || '{}' ));
    
    const base: Suggestion[] = JSON.parse(suggestion || '{}' ).recommendations.habits
    console.log(base);
    setBase(base);
    for(const e of base){
      console.log(e._id);
    }
    // Ưu tiên reorder theo vùng điểm thấp
    const weight = (s: Suggestion) => {
      if (s.category === 'mindful') return 100 - domainScores.mental;
      if (s.category === 'energy') return 100 - domainScores.physical;
      if (s.category === 'sleep') return 100 - domainScores.personal;
      return 80 - ((domainScores.social + domainScores.personal)/2);
    };

    return base.sort((a,b)=> weight(b)-weight(a));
  }, [domainScores]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const toggle = (id: string) => {setSelected((p)=> ({ ...p, [id]: !p[id] }))
  console.log(id);
};

  const addSelectedToHabits = async () => {
    const list = bas.filter(s => selected[s._id]);
    console.log(list);
    console.log(bas);
    if (list.length === 0) return;
    try {
      for (const s of list) {
        await createHabit(s);
      }
      router.push('/(tabs)/habits');
    } catch (e) {
      console.error('[HabitSuggestions] createHabit error:', e);
      router.push('/(tabs)/habits');
    }
  };

  const renderBar = (label: string, value: number) => (
    <div className="fsh-card" style={{ padding: 12, borderRadius: 14, flex: 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#334155', fontWeight:800 }}>
          <TrendingUp size={14} color="#334155" /> {label}
        </div>
        <div style={{ fontWeight:800, color:'#0f172a' }}>{value}</div>
      </div>
      <div className="fsh-progress" style={{ marginTop:6, height:8 }}>
        <div className="fsh-progress-fill" style={{ width:`${value}%`, background:'linear-gradient(90deg,#3b82f6,#1d4ed8)' }} />
      </div>
    </div>
  );

  return (
    <div className="fsh-page" style={{ height:'100vh', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
      {/* Header */}
      <div className="fsh-card fsh-header-card" style={{ margin:10, marginTop:12, padding:16, display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ width:40, height:40, borderRadius:20, background:'#2563eb', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#0f172a' }}>Thói quen được gợi ý cho bạn</div>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:700 }}>Dựa trên phân tích {Object.keys(answers).length || 12} câu trả lời của bạn</div>
          </div>
        </div>
        <div style={{ width:40, height:40, borderRadius:20, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Target size={20} color="#0f172a" />
        </div>
      </div>

      {/* Profile banner */}
      <div className="fsh-card" style={{ margin:'0 10px', padding:16, borderRadius:16, background:'linear-gradient(90deg,#3b82f6,#1d4ed8)', color:'#fff' }}>
        <div style={{ fontWeight:800, fontSize:14, opacity:0.9 }}>Hồ sơ của bạn</div>
        <div style={{ fontWeight:900, fontSize:16, marginTop:4 }}>Người bận rộn cần cân bằng</div>
        <div style={{ marginTop:8, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:12, padding:'6px 10px', fontWeight:800 }}> {Object.keys(answers).length || 12}/20 Câu hỏi đã trả lời</div>
          <div style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:12, padding:'6px 10px', fontWeight:800 }}>5 Gợi ý thói quen</div>
        </div>
      </div>

      {/* 4 scores */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'10px' }}>
        {renderBar('Mental', domainScores.mental)}
        {renderBar('Physical', domainScores.physical)}
        {renderBar('Social', domainScores.social)}
        {renderBar('Personal', domainScores.personal)}
      </div>

      {/* Improvement note */}
      <div className="fsh-card" style={{ margin:'0 10px', padding:12, borderRadius:12, background:'#fff7ed', border:'1px solid #fed7aa', color:'#b45309', fontWeight:700 }}>
        Các lĩnh vực cần cải thiện: Sức khỏe thể chất, Quản lý stress — Các thói quen dưới đây sẽ giúp bạn cải thiện những lĩnh vực này.
      </div>

      {/* Selection summary */}
      <div className="fsh-card" style={{ margin:'10px', padding:12, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#334155', fontWeight:800 }}>
          <Check size={16} color="#2563eb" /> Đã chọn {selectedCount} thói quen
        </div>
        <div style={{ fontSize:12, color:'#64748b' }}>Chọn các thói quen bạn muốn bắt đầu</div>
      </div>

      {/* Recommendations list */}
      <div style={{ margin:'0 10px' }}>
        {suggested.map((s, i) => (
          <div key={s.id} className="fsh-card" style={{ padding:14, borderRadius:16, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:900, color:'#0f172a' }}>#{i+1} {s.title}</div>
              <div style={{ fontWeight:900, color:'#2563eb' }}>{s.score}</div>
            </div>
            <div style={{ marginTop:6, color:'#475569' }}>{s.name}</div>
            <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={{ background:'#dcfce7', border:'1px solid #bbf7d0', color:'#16a34a', fontWeight:800, padding:'4px 8px', borderRadius:999 }}>{s.difficulty}</span>
              <span style={{ background:'#e0e7ff', border:'1px solid #c7d2fe', color:'#4338ca', fontWeight:800, padding:'4px 8px', borderRadius:999 }}>{s.description}</span>
            </div>
            <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:'#64748b', fontWeight:700 }}>Danh mục: {s.category}</div>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:800, color: selected[s.id] ? '#2563eb' : '#334155' }}>
                <input type="checkbox" checked={!!selected[s._id]} onChange={() => toggle(s._id)} />
                
                Chọn
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="hs-bottom-bar" style={{ margin:'0 10px', paddingBottom:8 }}>
        <button className="hs-btn-ghost" onClick={() => router.back()}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <ChevronLeft size={16} /> Quay lại
          </span>
        </button>
        <button className="hs-btn-primary" disabled={selectedCount === 0} onClick={addSelectedToHabits} style={{ opacity: selectedCount === 0 ? 0.6 : 1, cursor: selectedCount === 0 ? 'not-allowed' : 'pointer' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            Hoàn tất & thêm vào danh sách <ChevronRight size={16} color="#fff" />
          </span>
        </button>
      </div>

      <div className="footer" style={{ height:'10vh' }} />
    </div>
  );
}

