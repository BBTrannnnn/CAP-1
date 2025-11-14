import React, { useMemo, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Target, Check, TrendingUp } from 'lucide-react-native';
import '../../styles/FlowStateHabits.css';
import './HabitSurvey.css';

// 🔗 NỐI API
import { recommendHabits, getQuestionSurvey, submitSurvey } from '../../../server/habits';

// ===== Types cho UI =====
type Option = { value: number; label: string; emoji?: string };

type SurveyQuestion = {
  id: string;
  category: string;
  title: string;
  options: Option[];
};

// ===== Types dạng BE trả về =====
type BEOption = { id: string; text: string; value: number };

type BEQuestion = {
  id: string;
  text: string;
  type: string;
  category: string;
  options: BEOption[];
};

type SurveySessionResponse = {
  success: boolean;
  sessionId: string;
  questions: BEQuestion[];
  totalQuestions: number;
  strategy: string;
  answeredCount: number;
  isCompleted: boolean;
  createdAt: string;
  message?: string;
};

// Map category slug -> nhãn đẹp
const CATEGORY_LABELS: Record<string, string> = {
  digital: 'Digital',
  learning: 'Học tập',
  sleep: 'Giấc ngủ',
  energy: 'Năng lượng',
  social: 'Cộng đồng',
  productivity: 'Hiệu suất',
  fitness: 'Vận động',
  health: 'Sức khỏe',
  mindful: 'Tâm trí',
  control: 'Kỷ luật',
};

export default function HabitSurvey() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  // ✅ answers: questionId -> numeric value (1–4)
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = questions.length;
  const current = total > 0 ? questions[idx] : undefined;
  const progress = useMemo(
    () => (total > 0 ? Math.round((idx / total) * 100) : 0),
    [idx, total]
  );
  const selected = current ? answers[current.id] : undefined;

  // ================== LOAD CÂU HỎI TỪ BE ==================
  useEffect(() => {
    let cancelled = false;

    const fetchQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        setErrorMsg(null);

        const res: SurveySessionResponse | any = await getQuestionSurvey();
        console.log('[HabitSurvey] getQuestionSurvey response:', res);

        if (cancelled) return;

        if (res?.success && Array.isArray(res.questions)) {
          const beQuestions: BEQuestion[] = res.questions;

          if (res.sessionId) {
            setSessionId(res.sessionId);
          }

          const normalized: SurveyQuestion[] = beQuestions.map((q) => ({
            id: q.id,
            title: q.text,
            category: CATEGORY_LABELS[q.category] ?? q.category,
            options: (q.options || []).map((opt) => ({
              value: opt.value,
              label: opt.text,
            })),
          }));

          if (normalized.length > 0) {
            setQuestions(normalized);
            setIdx(0);
            setAnswers({});
            setDone(false);
            return;
          }
        }

        // Nếu response không hợp lệ hoặc không có câu hỏi
        setErrorMsg('Không tải được bộ câu hỏi khảo sát. Vui lòng thử lại sau.');
      } catch (err) {
        console.error('[HabitSurvey] getQuestionSurvey error:', err);
        if (!cancelled) {
          setErrorMsg('Có lỗi khi tải bộ câu hỏi khảo sát.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, []);

  // ================== HANDLER CHỌN OPTION ==================
  const selectOption = (opt: Option) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: opt.value }));
  };

  const goNext = () => {
    if (total === 0) return;
    if (idx < total - 1) setIdx((x) => x + 1);
    else setDone(true);
  };

  const goPrev = () => {
    if (total === 0) return;
    setIdx((x) => Math.max(0, x - 1));
  };

  // 🔁 Làm lại khảo sát (reset state, không cần F5)
  const handleRedo = () => {
    setIdx(0);
    setAnswers({});
    setDone(false);
    setErrorMsg(null);
    setIsLoading(false);
  };

  // ================== GỌI API GỢI Ý THÓI QUEN ==================
  const handleViewSuggestions = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // hiện tại wrapper recommendHabits(answers, limit)
      const res: any = await recommendHabits(answers, 5);
      console.log('[HabitSurvey] recommendHabits response:', res);
      sessionStorage.setItem("suggestion", JSON.stringify(res));
      let suggestions: any[] = [];
      if (Array.isArray(res)) suggestions = res;
      else if (Array.isArray(res?.habits)) suggestions = res.habits;
      else if (Array.isArray(res?.recommendations)) suggestions = res.recommendations;
      else if (Array.isArray(res?.data)) suggestions = res.data;

      const payload = { sessionId, answers, suggestions };
      const data = encodeURIComponent(JSON.stringify(payload));

      router.push({
        pathname: '/(tabs)/habits/HabitSuggestions',
        params: { data },
      });
    } catch (err) {
      console.error('[HabitSurvey] recommendHabits error:', err);
      setErrorMsg('Không thể tải gợi ý thói quen. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================== GỬI KẾT QUẢ KHẢO SÁT LÊN BE ==================
  useEffect(() => {
    if (!done) return;
    const submit = async () => {
      try {
        const reqBody: any = { answers };
        if (sessionId) reqBody.sessionId = sessionId;

        const res = await submitSurvey(reqBody);
        console.log('[HabitSurvey] submitSurvey response:', res);
      } catch (err) {
        console.error('[HabitSurvey] submitSurvey error:', err);
        setErrorMsg('Không thể gửi kết quả khảo sát. Vui lòng thử lại.');
      }
    };
    submit();
  }, [done, answers, sessionId]);

  // ================== UI: ĐANG LOAD CÂU HỎI ==================
  if (isLoadingQuestions) {
    return (
      <div
        className="fsh-page"
        style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="fsh-card fsh-header-card"
          style={{
            margin: 10,
            marginTop: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                Khảo sát thói quen
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 700,
                }}
              >
                Đang tải bộ câu hỏi...
              </div>
            </div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={20} color="#0f172a" />
          </div>
        </div>
        <div
          className="fsh-card"
          style={{
            margin: '12px 10px',
            padding: 18,
            borderRadius: 24,
            background: '#F8FAFF',
            border: '1px solid rgba(148,163,184,0.4)',
          }}
        >
          <div style={{ fontSize: 14, color: '#334155' }}>Vui lòng chờ trong giây lát...</div>
        </div>
      </div>
    );
  }

  // ================== UI: KHÔNG CÓ CÂU HỎI ==================
  if (!current) {
    return (
      <div
        className="fsh-page"
        style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="fsh-card fsh-header-card"
          style={{
            margin: 10,
            marginTop: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                Khảo sát thói quen
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 700,
                }}
              >
                Không có câu hỏi để hiển thị
              </div>
            </div>
          </div>
        </div>

        <div
          className="fsh-card"
          style={{
            margin: '12px 10px',
            padding: 18,
            borderRadius: 24,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
          }}
        >
          <div style={{ fontSize: 14, color: '#B91C1C', marginBottom: 8 }}>
            {errorMsg || 'Không tải được bộ câu hỏi khảo sát.'}
          </div>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: 8,
              padding: '10px 14px',
              borderRadius: 12,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ================== UI: ĐÃ HOÀN TẤT ==================
  if (done) {
    return (
      <div
        className="fsh-page"
        style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="fsh-card fsh-header-card"
          style={{
            margin: 10,
            marginTop: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 20,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
              Hoàn tất khảo sát
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Cảm ơn bạn đã trả lời</div>
          </div>
        </div>

        <div
          className="fsh-card"
          style={{ margin: '0 10px', padding: 16, borderRadius: 20 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '8px 10px',
              marginBottom: 10,
            }}
          >
            <Check size={16} color="#16a34a" />
            <div style={{ fontWeight: 800, color: '#16a34a' }}>
              Đã hoàn thành {total} câu hỏi
            </div>
          </div>
          <div style={{ fontSize: 14, color: '#334155' }}>
            Dựa trên câu trả lời của bạn, ứng dụng sẽ gợi ý các thói quen phù hợp ở màn hình Habits.
          </div>

          {/* Hiển thị lỗi API nếu có */}
          {errorMsg && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => router.push('/(tabs)/habits')}
              style={{
                background: '#e5e7eb',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Về danh sách thói quen
            </button>

            {/* 🔁 NÚT LÀM LẠI KHẢO SÁT */}
            <button
              onClick={handleRedo}
              style={{
                background: '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Làm lại khảo sát
            </button>

            <button
              onClick={handleViewSuggestions}
              disabled={isLoading}
              style={{
                background: '#2563eb',
                opacity: isLoading ? 0.7 : 1,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                cursor: isLoading ? 'wait' : 'pointer',
              }}
            >
              {isLoading ? 'Đang tải gợi ý...' : 'Xem gợi ý'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================== UI: MÀN HỎI CÂU HỎI ==================
  return (
    <div
      className="fsh-page"
      style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="fsh-card fsh-header-card"
        style={{
          margin: 10,
          marginTop: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              Khảo sát thói quen
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              Trả lời {total} câu hỏi để nhận gợi ý phù hợp
            </div>
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Target size={20} color="#0f172a" />
        </div>
      </div>

      <div
        className="fsh-card hs-sticky-progress"
        style={{ margin: '0 10px', padding: 12, borderRadius: 20 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
            Câu hỏi {idx + 1}/{total}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
            {progress}% hoàn thành
          </div>
        </div>
        <div className="fsh-progress" style={{ marginTop: 6, background: '#e5e7eb' }}>
          <div
            className="fsh-progress-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #7c3aed)',
            }}
          />
        </div>
      </div>

      <div
        className="fsh-card"
        style={{
          margin: '12px 10px',
          padding: 18,
          borderRadius: 24,
          background: '#F8FAFF',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#e9fce9',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            fontWeight: 800,
            padding: '6px 10px',
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <TrendingUp size={14} color="#16a34a" /> {current.category}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: 16,
          }}
        >
          {current.title}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {current.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectOption(opt)}
                className="hs-option"
                data-selected={isSelected ? 'true' : 'false'}
                style={{
                  color: isSelected ? '#4f46e5' : '#334155',
                }}
              >
                {opt.emoji && <span style={{ fontSize: 18 }}>{opt.emoji}</span>}
                <span className="hs-label" style={{ fontSize: 15 }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <Check size={18} color="#6366f1" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom sticky action bar */}
      <div className="hs-bottom-bar" style={{ margin: '0 10px' }}>
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="hs-btn-ghost"
          style={{
            opacity: idx === 0 ? 0.6 : 1,
            cursor: idx === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ChevronLeft size={16} /> Quay lại
          </span>
        </button>
        <button
          onClick={goNext}
          disabled={!selected}
          className="hs-btn-primary"
          style={{
            opacity: !selected ? 0.6 : 1,
            cursor: !selected ? 'not-allowed' : 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {idx === total - 1 ? 'Hoàn tất' : 'Tiếp theo'}{' '}
            <ChevronRight size={16} color="#fff" />
          </span>
        </button>
      </div>

      <div className="footer" style={{ height: '10vh' }} />
    </div>
  );
}
