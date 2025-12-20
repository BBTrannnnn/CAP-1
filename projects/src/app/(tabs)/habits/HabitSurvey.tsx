import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Target, Check, TrendingUp } from 'lucide-react-native';

// 🔗 NỐI API
import {
  recommendHabits,
  getQuestionSurvey,
  submitSurvey,
  createHabit,
} from '../../../server/habits';
import Notification from './ToastMessage';

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

type UserInfo = {
  name?: string;
  age?: number;
  ageGroup?: string;
  ageGroupCode?: string;
  gender?: string;
  genderCode?: string;
};

// Gợi ý thói quen
type Suggestion = {
  id?: string;
  _id?: string;
  name: string;
  title: string;
  description: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  time: string;
  category: 'mindful' | 'energy' | 'sleep' | 'productivity' | 'social' | 'personal';
  score: number;
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

// Helper functions for difficulty styling
const getDifficultyStyle = (difficulty: string) => {
  console.log('Difficulty value:', difficulty); // Debug log
  switch (difficulty) {
    case 'Dễ':
    case 'easy':
    case 'Easy':
      return {
        backgroundColor: '#dcfce7',
        borderColor: '#bbf7d0',
        textColor: '#16a34a',
        icon: ''
      };
    case 'Trung bình':
    case 'medium':
    case 'Medium':
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#fde68a',
        textColor: '#d97706',
        icon: ''
      };
    case 'Khó':
    case 'hard':
    case 'Hard':
      return {
        backgroundColor: '#fecaca',
        borderColor: '#f87171',
        textColor: '#dc2626',
        icon: ''
      };
    default:
      console.log('Using default style for difficulty:', difficulty); // Debug log
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#6b7280',
        icon: ''
      };
  }
};

// Helper function for category icons
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    digital: '📱',
    learning: '📚',
    sleep: '😴',
    energy: '⚡',
    social: '👥',
    productivity: '🎯',
    fitness: '💪',
    health: '🏥',
    mindful: '🧘',
    control: '🎛️',
  };
  return icons[category] || '📋';
};

type ViewMode = 'survey' | 'summary' | 'suggestions';

const defaultDomainScores = {
  mental: 60,
  physical: 60,
  social: 60,
  personal: 60,
};

export default function HabitSurveyMobile() {
  // ================== STATE CHUNG ==================
  const [view, setView] = useState<ViewMode>('survey');

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  // ✅ answers: questionId -> numeric value (1–4)
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const total = questions.length;
  const current = total > 0 ? questions[idx] : undefined;
  const progress = useMemo(
    () => (total > 0 ? Math.round(((idx + 1) / total) * 100) : 0),
    [idx, total],
  );
  const selectedOptionValue = current ? answers[current.id] : undefined;

  // ================== STATE GỢI Ý THÓI QUEN ==================
  const [domainScores, setDomainScores] = useState(defaultDomainScores);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Record<string, boolean>>({});
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const selectedCount = useMemo(
    () => Object.values(selectedHabits).filter(Boolean).length,
    [selectedHabits],
  );

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
            setView('survey');
            return;
          }
        }

        // Nếu response không hợp lệ hoặc không có câu hỏi
        setErrorMsg('Không tải được bộ câu hỏi khảo sát. Vui lòng thử lại sau.');
        showToast('Không tải được bộ câu hỏi khảo sát', 'error');
      } catch (err) {
        console.error('[HabitSurvey] getQuestionSurvey error:', err);
        if (!cancelled) {
          setErrorMsg('Có lỗi khi tải bộ câu hỏi khảo sát.');
          showToast('Có lỗi khi tải bộ câu hỏi khảo sát', 'error');
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
    if (!selectedOptionValue) return;
    if (idx < total - 1) {
      setIdx((x) => x + 1);
    } else {
      setDone(true);
      setView('summary');
    }
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
    setUserInfo(null);
    setView('survey');
  };

  // ================== GỌI API GỢI Ý THÓI QUEN ==================
  const handleViewSuggestions = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res: any = await recommendHabits(answers,20);
      console.log('[HabitSurvey] recommendHabits response:', res);

      let extractedUserInfo: UserInfo | null = null;
      const resUser =
        res?.userInfo ||
        res?.recommendations?.userInfo ||
        res?.data?.userInfo;
      if (resUser && typeof resUser === 'object') {
        extractedUserInfo = {
          name: resUser.name,
          age: resUser.age,
          ageGroup: resUser.ageGroup || resUser.ageGroupLabel,
          ageGroupCode: resUser.ageGroupCode,
          gender: resUser.gender || resUser.genderLabel,
          genderCode: resUser.genderCode,
        };
      } else if (res?.metadata?.personalizationSummary) {
        const summary = res.metadata.personalizationSummary;
        extractedUserInfo = {
          ageGroup: summary.ageGroupLabel || summary.ageGroup,
          gender: summary.genderLabel || summary.gender,
        };
      }

      // Parse mảng habits từ nhiều định dạng BE
      let base: Suggestion[] = [];
      if (Array.isArray(res)) base = res;
      else if (Array.isArray(res?.habits)) base = res.habits;
      else if (Array.isArray(res?.recommendations?.habits))
        base = res.recommendations.habits;
      else if (Array.isArray(res?.recommendations)) base = res.recommendations;
      else if (Array.isArray(res?.data)) base = res.data;

      if (!base || base.length === 0) {
        setErrorMsg('Không tìm thấy gợi ý thói quen phù hợp.');
        return;
      }

      setUserInfo(extractedUserInfo);

      // Ở đây tạm dùng domainScores mặc định (có thể sau này tính theo answers)
      const ds = defaultDomainScores;
      setDomainScores(ds);

      const weight = (s: Suggestion) => {
        if (s.category === 'mindful') return 100 - ds.mental;
        if (s.category === 'energy') return 100 - ds.physical;
        if (s.category === 'sleep') return 100 - ds.personal;
        return 80 - (ds.social + ds.personal) / 2;
      };

      const sorted = [...base].sort((a, b) => weight(b) - weight(a));
      setSuggestions(sorted);
      setSelectedHabits({});
      setView('suggestions');
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
        showToast('Không thể gửi kết quả khảo sát', 'error');
      }
    };
    submit();
  }, [done, answers, sessionId]);

  // ================== THÊM THÓI QUEN ==================
  const toggleHabit = (habit: Suggestion) => {
    const key = habit._id || habit.id || habit.name;
    setSelectedHabits((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toast helper functions
  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const addSelectedToHabits = async () => {
    const list = suggestions.filter((s) => {
      const key = s._id || s.id || s.name;
      return selectedHabits[key];
    });

    if (list.length === 0) {
      showToast('Hãy chọn ít nhất 1 thói quen để thêm.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      for (const s of list) {
        await createHabit(s);
      }
      showToast('Đã thêm thói quen vào danh sách.', 'success');
      setTimeout(() => {
        router.push('/(tabs)/habits');
      }, 1500);
    } catch (e) {
      console.error('[HabitSuggestions] createHabit error:', e);
      showToast('Không thể thêm thói quen. Vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ================== UI CHUNG HEADER ==================
  const renderHeader = (title: string, subtitle?: string, showBackToHabits = true) => (
    <View style={styles.headerCard}>
      <View style={styles.headerLeft}>
        {showBackToHabits && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/habits')}
            style={styles.headerBackBtn}
          >
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.headerIconWrapper}>
        <Target size={20} color="#0f172a" />
      </View>
    </View>
  );

  // ================== UI: ĐANG LOAD CÂU HỎI ==================
  if (isLoadingQuestions && view === 'survey') {
    return (
      <>
        <View style={styles.page}>
          {renderHeader('Khảo sát thói quen', 'Đang tải bộ câu hỏi...')}
          <View style={styles.card}>
            <Text style={styles.textNormal}>Vui lòng chờ trong giây lát...</Text>
            <ActivityIndicator style={{ marginTop: 12 }} />
          </View>
        </View>
        
        {/* Toast Notification */}
        {toast.show && (
          <Notification
            type={toast.type}
            message={toast.message}
            onClose={hideToast}
            show={toast.show}
          />
        )}
      </>
    );
  }

  // ================== UI: KHÔNG CÓ CÂU HỎI ==================
  if (!current && (view === 'survey' || view === 'summary')) {
    return (
      <>
        <View style={styles.page}>
          {renderHeader('Khảo sát thói quen', 'Không có câu hỏi để hiển thị')}
          <View style={[styles.card, styles.cardError]}>
            <Text style={styles.errorText}>
              {errorMsg || 'Không tải được bộ câu hỏi khảo sát.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits')}
              style={[styles.btnPrimary, { marginTop: 8 }]}
            >
              <Text style={styles.btnPrimaryText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Toast Notification */}
        {toast.show && (
          <Notification
            type={toast.type}
            message={toast.message}
            onClose={hideToast}
            show={toast.show}
          />
        )}
      </>
    );
  }

  // ================== UI: ĐÃ HOÀN TẤT (SUMMARY) ==================
  if (view === 'summary') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
        {renderHeader('Hoàn tất khảo sát', 'Cảm ơn bạn đã trả lời', false)}

        <View style={styles.card}>
          <View style={styles.summaryBadge}>
            <Check size={16} color="#16a34a" />
            <Text style={styles.summaryBadgeText}>Đã hoàn thành {total} câu hỏi</Text>
          </View>

          <Text style={styles.textNormal}>
            Dựa trên câu trả lời của bạn, ứng dụng sẽ gợi ý các thói quen phù hợp.
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.summaryButtonsContainer}>
            {/* Hàng trên: 2 button nhỏ */}
            <View style={styles.summaryButtonsTopRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/habits')}
                style={styles.btnGray}
              >
                <Text style={styles.btnGrayText}>Về danh sách thói quen</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRedo} style={styles.btnWarning}>
                <Text style={styles.btnWarningText}>Làm lại khảo sát</Text>
              </TouchableOpacity>
            </View>

            {/* Hàng dưới: 1 button lớn */}
            <TouchableOpacity
              onPress={handleViewSuggestions}
              disabled={isLoading}
              style={[
                styles.btnPrimaryLarge,
                isLoading ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={styles.btnPrimaryLargeText}>
                {isLoading ? 'Đang tải gợi ý...' : 'Xem gợi ý'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Toast Notification */}
        {toast.show && (
          <Notification
            type={toast.type}
            message={toast.message}
            onClose={hideToast}
            show={toast.show}
          />
        )}
      </ScrollView>
    );
  }

  // ================== UI: GỢI Ý THÓI QUEN ==================
  if (view === 'suggestions') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header gợi ý */}
        {renderHeader(
          'Thói quen được gợi ý',
          `Dựa trên phân tích ${Object.keys(answers).length || 0} câu trả lời của bạn`,
        )}

        {/* Hồ sơ + tóm tắt */}
        <View style={styles.profileBanner}>
          <Text style={styles.profileTitle}>Hồ Sơ Của Bạn</Text>
          <Text style={styles.profileSubtitle}>
            {userInfo?.name || 'Nguoi ban ron can can bang'}
          </Text>

          {userInfo ? (
            <View style={styles.profileTagsRow}>
              {userInfo.gender ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>Giới Tính: {userInfo.gender}</Text>
                </View>
              ) : null}
              {userInfo.age != null ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>{userInfo.age} Tuổi</Text>
                </View>
              ) : null}
              {userInfo.ageGroup ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>{userInfo.ageGroup}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.profileTagsRow}>
            <View style={styles.profileTag}>
              <Text style={styles.profileTagText}>
                {Object.keys(answers).length || 0}/{total} Câu Hỏi Trả Lời
              </Text>
            </View>
            <View style={styles.profileTag}>
              <Text style={styles.profileTagText}>
                {suggestions.length} Gợi Ý Thói Quen
              </Text>
            </View>
          </View>
        </View>
        {/* 4 scores */}
        <View style={styles.scoreGrid}>
          {renderScoreBar('Mental', domainScores.mental)}
          {renderScoreBar('Physical', domainScores.physical)}
          {renderScoreBar('Social', domainScores.social)}
          {renderScoreBar('Personal', domainScores.personal)}
        </View>

        {/* Note */}
        <View style={styles.improveNote}>
          <Text style={styles.improveNoteText}>
            Các lĩnh vực cần cải thiện: Sức khỏe thể chất, Quản lý stress — Các thói quen dưới
            đây sẽ giúp bạn cải thiện những lĩnh vực này.
          </Text>
        </View>

        {/* Tóm tắt chọn */}
        <View style={styles.selectionHeader}>
          <View style={styles.selectionHeaderLeft}>
            <View style={styles.selectionBadge}>
              <Check size={16} color="#ffffff" />
              <Text style={styles.selectionBadgeText}>
                Đã chọn {selectedCount} thói quen
              </Text>
            </View>
          </View>
          <Text style={styles.selectionHeaderHint}>
            Chọn các thói quen bạn muốn bắt đầu
          </Text>
        </View>

        {/* Danh sách gợi ý */}
        {suggestions.map((s, i) => {
          const key = s._id || s.id || s.name;
          const isSelected = !!selectedHabits[key];
          const difficultyStyle = getDifficultyStyle(s.difficulty);
          const categoryIcon = getCategoryIcon(s.category);

          return (
            <TouchableOpacity 
              key={key} 
              onPress={() => toggleHabit(s)}
              style={[
                styles.habitCard,
                isSelected && styles.habitCardSelected
              ]}
            >
              {/* Main content với checkbox bên trái */}
              <View style={styles.habitCardMain}>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && <Check size={16} color="#ffffff" />}
                </View>
                
                <View style={styles.habitCardContent}>
                  {/* Header với tên thói quen */}
                  <View style={styles.habitCardTitleRow}>
                    <Text style={styles.habitCardTitle}>
                      #{i + 1} {s.name || s.title}
                    </Text>
                  </View>

                  {/* Difficulty và Category tags nổi bật */}
                  <View style={styles.habitTagsRow}>
                    <View style={[
                      styles.habitDifficultyTag,
                      { 
                        backgroundColor: difficultyStyle.backgroundColor,
                        borderColor: difficultyStyle.borderColor 
                      }
                    ]}>
                      <Text style={[
                        styles.habitDifficultyText,
                        { color: difficultyStyle.textColor }
                      ]}>
                        {s.difficulty}
                      </Text>
                    </View>
                    
                    <View style={styles.habitCategoryTag}>
                      <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                      <Text style={styles.habitCategoryTagText}>{s.category}</Text>
                    </View>
                  </View>

                  {/* Description bubble nổi bật */}
                  <View style={styles.habitDescriptionBubble}>
                    <Text style={styles.habitDescriptionText}>{s.description}</Text>
                  </View>

                  {/* Footer chỉ với danh mục và button chọn */}
                  <View style={styles.habitCardFooter}>
                    <View style={styles.habitCategoryRow}>
                      <Text style={styles.habitCategoryIcon}>📂</Text>
                      <Text style={styles.habitCategoryText}>Danh mục: {s.category}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.habitSelectButton,
                        isSelected && styles.habitSelectButtonSelected
                      ]}
                      onPress={() => toggleHabit(s)}
                    >
                      <Text style={[
                        styles.habitSelectButtonText,
                        isSelected && styles.habitSelectButtonTextSelected
                      ]}>
                        {isSelected ? '✓ Đã chọn' : 'Chọn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => setView('summary')}
            style={styles.btnGhost}
          >
            <View style={styles.bottomBtnRow}>
              <ChevronLeft size={16} />
              <Text style={styles.btnGhostText}>Quay lại</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={addSelectedToHabits}
            disabled={selectedCount === 0 || isLoading}
            style={[
              styles.btnPrimary,
              (selectedCount === 0 || isLoading) && { opacity: 0.6 },
            ]}
          >
            <View style={styles.bottomBtnRow}>
              <Text style={styles.btnPrimaryText}>Hoàn tất & thêm vào danh sách</Text>
              <ChevronRight size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Toast Notification */}
        {toast.show && (
          <Notification
            type={toast.type}
            message={toast.message}
            onClose={hideToast}
            show={toast.show}
          />
        )}
      </ScrollView>
    );
  }

  // ================== UI: MÀN HỎI CÂU HỎI (SURVEY) ==================
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      {renderHeader(
        'Khảo sát thói quen',
        `Trả lời ${total} câu hỏi để nhận gợi ý phù hợp`,
      )}

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressText}>
            Câu hỏi {idx + 1}/{total}
          </Text>
          <Text style={styles.progressText}>{progress}% hoàn thành</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Câu hỏi */}
      <View style={styles.questionCard}>
        <View style={styles.questionCategoryBadge}>
          <TrendingUp size={14} color="#16a34a" />
          <Text style={styles.questionCategoryText}>{current?.category}</Text>
        </View>
        <Text style={styles.questionTitle}>{current?.title}</Text>

        <View style={{ flexDirection: 'column', gap: 12 }}>
          {current?.options.map((opt) => {
            const isSelected = selectedOptionValue === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => selectOption(opt)}
                style={[
                  styles.optionBtn,
                  isSelected && styles.optionBtnSelected,
                ]}
              >
                {opt.emoji && <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>}
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && { color: '#4f46e5' },
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && (
                  <View style={styles.optionCheckIcon}>
                    <Check size={18} color="#6366f1" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={idx === 0}
          style={[
            styles.btnGhost,
            idx === 0 && { opacity: 0.6 },
          ]}
        >
          <View style={styles.bottomBtnRow}>
            <ChevronLeft size={16} />
            <Text style={styles.btnGhostText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          disabled={!selectedOptionValue}
          style={[
            styles.btnPrimary,
            !selectedOptionValue && { opacity: 0.6 },
          ]}
        >
          <View style={styles.bottomBtnRow}>
            <Text style={styles.btnPrimaryText}>
              {idx === total - 1 ? 'Hoàn tất' : 'Tiếp theo'}
            </Text>
            <ChevronRight size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Toast Notification */}
      {toast.show && (
        <Notification
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
          show={toast.show}
        />
      )}
    </ScrollView>
  );
}

// =============== COMPONENT PHỤ ===============
function renderScoreBar(label: string, value: number) {
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreHeaderRow}>
        <View style={styles.scoreLabelRow}>
          <TrendingUp size={14} color="#334155" />
          <Text style={styles.scoreLabelText}>{label}</Text>
        </View>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: '#3b82f6' },
          ]}
        />
      </View>
    </View>
  );
}

// =============== STYLES ===============
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerCard: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  textNormal: {
    fontSize: 14,
    color: '#334155',
  },
  cardError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBox: {
    marginTop: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  summaryBadgeText: {
    fontWeight: '800',
    color: '#16a34a',
  },
  summaryButtonsContainer: {
    marginTop: 20,
    gap: 12,
  },
  summaryButtonsTopRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width:'48%'
  },
  btnPrimaryLarge: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  btnPrimaryLargeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  btnGray: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flex: 1,
    alignItems: 'center',
  },
  btnGrayText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  btnWarning: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnWarningText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  profileBanner: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
  },
  profileTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  profileSubtitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#ffffff',
    marginTop: 4,
  },
  profileTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  profileTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileTagText: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 12,
  },

  scoreGrid: {
    marginHorizontal: 10,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabelText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 12,
  },
  scoreValue: {
    fontWeight: '800',
    color: '#0f172a',
  },

  improveNote: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  improveNoteText: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: 13,
  },

  selectionHeader: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectionBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  selectionHeaderText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
  selectionHeaderHint: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },

  habitCard: {
    marginHorizontal: 10,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  habitCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f8faff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.2,
  },
  habitCardMain: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
    gap: 16,
  },
  habitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitCardTitleRow: {
    marginBottom: 12,
  },
  habitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  habitCardContent: {
    flex: 1,
  },
  habitCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
  },
  habitTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  habitCardSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  habitCardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  habitDescriptionBubble: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  descriptionHeader: {
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  habitDescriptionText: {
    fontSize: 15,
    color: '#1e40af',
    lineHeight: 22,
    fontWeight: '500',
  },
  habitCardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitDifficultyTag: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    // Đảm bảo có background color mặc định
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  habitDifficultyText: {
    fontWeight: '700',
    fontSize: 13,
    // Đảm bảo có text color mặc định
    color: '#6b7280',
  },
  habitCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryIcon: {
    fontSize: 14,
  },
  habitCategoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  habitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  habitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  timeIcon: {
    fontSize: 16,
  },
  habitTimeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  habitCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  habitCategoryIcon: {
    fontSize: 16,
  },
  habitCategoryInfo: {
    flex: 1,
    marginLeft: 8,
  },
  habitCategoryText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  habitSelectButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  habitSelectButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  habitSelectButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  habitSelectButtonTextSelected: {
    color: '#ffffff',
  },

  bottomBar: {
    marginHorizontal: 10,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    textAlign: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  progressCard: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  progressBarBg: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6366f1',
  },

  questionCard: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  questionCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e9fce9',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  questionCategoryText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 12,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  optionBtn: {
    position: 'relative',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionBtnSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionLabel: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  optionCheckIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
  },
});
