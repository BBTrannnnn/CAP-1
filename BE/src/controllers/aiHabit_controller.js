import { HabitRecommendationEngine } from '../utils/recommend.js';
import { HabitSuggestion, Question, UserSurveySession } from '../models/Survey.js';
import asyncHandler from 'express-async-handler';

// Cache
let cachedHabits = null;
let cachedQuestions = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * ================================
 * 🆕 CALCULATE AGE FROM DATE OF BIRTH
 * ================================
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  // Validate date
  if (isNaN(birthDate.getTime())) {
    return null;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Chưa đến sinh nhật năm nay thì trừ đi 1 tuổi
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? age : null;
}

function formatAgeGroupLabel(ageGroup) {
  const labels = {
    teens: 'Thanh thiếu niên (13-17 tuổi)',
    young_adult: 'Thanh niên (18-29 tuổi)',
    adult: 'Trưởng thành (30-49 tuổi)',
    middle_aged: 'Trung niên (50+ tuổi)'
  };
  return labels[ageGroup] || ageGroup;
}

function formatGenderLabel(gender) {
  const labels = {
    male: 'Nam',
    female: 'Nữ'
  };
  return labels[gender] || gender;
}

function determineAgeGroup(age) {
  if (!age) return 'young_adult';
  
  if (age < 18) return 'teens';
  if (age < 30) return 'young_adult';
  if (age < 50) return 'adult';
  return 'middle_aged';
}

export const getHabitRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔧 Calculate age từ dateOfBirth hoặc dùng age có sẵn
  const age = req.user.age || calculateAge(req.user.dateOfBirth);

  // Validation: Check age và gender
  if (!age || !req.user.gender) {
    return res.status(400).json({
      success: false,
      message: !age 
        ? 'Vui lòng cập nhật ngày sinh trong profile để nhận gợi ý phù hợp.'
        : 'Vui lòng cập nhật giới tính trong profile để nhận gợi ý phù hợp.',
      debug: {
        hasAge: !!age,
        hasGender: !!req.user.gender,
        hasDateOfBirth: !!req.user.dateOfBirth,
        calculatedAge: age
      }
    });
  }

  // Tạo user profile
  const ageGroup = determineAgeGroup(age);
  
  const userProfile = {
    ageGroup,
    gender: req.user.gender,
    age: age,
    userId: req.user._id
  };

  // Get survey session
  const session = await UserSurveySession.findOne({
    userId,
    isCompleted: true
  }).sort({ completedAt: -1 });

  if (!session || !session.answers || session.answers.size === 0) {
    return res.status(400).json({
      success: false,
      message: 'Chưa có câu trả lời để gợi ý thói quen. Vui lòng hoàn thành survey trước.',
      userProfile: {
        age: age,
        ageGroup: formatAgeGroupLabel(ageGroup),
        gender: formatGenderLabel(req.user.gender)
      }
    });
  }

  // Load habits & questions từ cache
  const now = Date.now();
  if (!cachedHabits || !cachedQuestions || now - cacheTime > CACHE_DURATION) {
    console.log('🔄 Refreshing cache...');
    const [habitDocs, questionDocs] = await Promise.all([
      HabitSuggestion.find().lean(),
      Question.find().lean()
    ]);

    cachedHabits = habitDocs;
    cachedQuestions = questionDocs;
    cacheTime = now;
    console.log(`✅ Cache refreshed: ${habitDocs.length} habits, ${questionDocs.length} questions`);
  }

  // Chuyển answers sang object
  const answersObj = Object.fromEntries(session.answers);
  const usedQuestions = cachedQuestions.filter(q => answersObj[q.id] !== undefined);

  // Tạo Personalized Engine
  const engine = new HabitRecommendationEngine(cachedHabits, usedQuestions);
  
  // 🤖 Generate recommendations với AI insights (async!)
  const limit = parseInt(req.query.limit, 10) || 5;
  
  try {
    const recommendations = await engine.recommend(answersObj, userProfile, limit);

    // Check nếu không có habits
    if (!recommendations.habits || recommendations.habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thói quen phù hợp. Vui lòng thử lại sau.',
        userProfile: {
          name: req.user.name,
          age: age,
          ageGroup: formatAgeGroupLabel(ageGroup),
          gender: formatGenderLabel(req.user.gender)
        }
      });
    }

    // Build response
    res.json({
      success: true,
      
      userInfo: {
        name: req.user.name || 'User',
        age: age,
        ageGroup: formatAgeGroupLabel(userProfile.ageGroup),
        ageGroupCode: userProfile.ageGroup,
        gender: formatGenderLabel(userProfile.gender),
        genderCode: userProfile.gender
      },
      
      recommendations: {
        habits: recommendations.habits,
        insights: recommendations.insights, // 🤖 AI-generated!
        persona: recommendations.persona,
        experienceLevel: recommendations.experienceLevel
      },
      
      metadata: {
        totalAnswered: Object.keys(answersObj).length,
        totalQuestions: usedQuestions.length,
        limit,
        
        categoryScores: recommendations.categoryScores,
        weakAreas: recommendations.weakAreas,
        
        personalizationSummary: {
          ...recommendations.personalizationSummary,
          ageGroupLabel: formatAgeGroupLabel(userProfile.ageGroup),
          genderLabel: formatGenderLabel(userProfile.gender)
        },
        
        sessionId: session._id,
        completedAt: session.completedAt
      }
    });

  } catch (error) {
    console.error('❌ Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi khi tạo gợi ý. Vui lòng thử lại.',
      error: error.message
    });
  }
});