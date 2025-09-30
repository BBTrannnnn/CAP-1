import asyncHandler from "express-async-handler";
import { Question, SurveyResponse, UserAnalysis, HabitSuggestion } from '../models/Survey.js';
import User from '../models/User.js';

// Get survey questions
const getSurveyQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find().sort({ id: 1 });
  
  if (!questions.length) {
    return res.status(404).json({
      success: false,
      message: 'No survey questions found. Please contact admin to initialize survey data.'
    });
  }
  
  res.json({
    success: true,
    questions
  });
});

// Submit survey responses
const submitSurvey = asyncHandler(async (req, res) => {
  const { responses } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid survey responses format'
    });
  }

  try {
    // Clear existing responses for this user
    await SurveyResponse.deleteMany({ userId });

    // Calculate scores and save responses
    const savedResponses = [];
    let totalScore = 0;
    const categoryScores = {
      health: 0,
      productivity: 0,
      learning: 0,
      finance: 0,
      relationships: 0,
      mindful: 0
    };

    for (const response of responses) {
      const question = await Question.findOne({ id: response.questionId });
      if (!question) continue;

      let responseScore = 0;
      for (const optionId of response.selectedOptions) {
        const option = question.options.find(opt => opt.id === optionId);
        if (option) {
          responseScore += option.value || 0;
        }
      }

      const surveyResponse = new SurveyResponse({
        userId,
        questionId: response.questionId,
        selectedOptions: response.selectedOptions,
        score: responseScore,
        category: question.category
      });

      await surveyResponse.save();
      savedResponses.push(surveyResponse);

      totalScore += responseScore;
      categoryScores[question.category] += responseScore;
    }

    // Analyze user persona
    const userPersona = analyzeUserPersona(categoryScores);

    // Save or update user analysis
    await UserAnalysis.findOneAndUpdate(
      { userId },
      {
        totalScore,
        categoryScores,
        userPersona,
        completedAt: new Date(),
        needsUpdate: false
      },
      { upsert: true, new: true }
    );

    // Get suggested habits
    const suggestedHabits = await getSuggestedHabits(userId, categoryScores, userPersona);

    res.json({
      success: true,
      message: 'Survey completed successfully',
      analysis: {
        totalScore,
        categoryScores,
        userPersona
      },
      suggestedHabits
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process survey'
    });
  }
});

// Get user's suggested habits
const getUserSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const userAnalysis = await UserAnalysis.findOne({ userId });
  if (!userAnalysis) {
    return res.status(404).json({
      success: false,
      message: 'Please complete the survey first'
    });
  }

  const suggestedHabits = await getSuggestedHabits(
    userId, 
    userAnalysis.categoryScores, 
    userAnalysis.userPersona
  );

  res.json({
    success: true,
    analysis: userAnalysis,
    suggestedHabits
  });
});

// Get user's current analysis
const getUserAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const userAnalysis = await UserAnalysis.findOne({ userId })
    .populate('userId', 'name email');
  
  if (!userAnalysis) {
    return res.status(404).json({
      success: false,
      message: 'User has not completed survey yet'
    });
  }
  
  res.json({
    success: true,
    analysis: userAnalysis
  });
});

// Retake survey (reset analysis)
const resetSurvey = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Delete existing responses and analysis
    await SurveyResponse.deleteMany({ userId });
    await UserAnalysis.deleteOne({ userId });
    
    res.json({
      success: true,
      message: 'Survey reset successfully. You can take it again.'
    });
  } catch (error) {
    console.error('Reset survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset survey'
    });
  }
});

// Get survey statistics (admin)
// const getSurveyStats = asyncHandler(async (req, res) => {
//   try {
//     const totalUsers = await UserAnalysis.countDocuments();
    
//     // Count by persona
//     const personaStats = await UserAnalysis.aggregate([
//       {
//         $group: {
//           _id: '$userPersona',
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { count: -1 }
//       }
//     ]);
    
//     // Average scores by category
//     const categoryAvgScores = await UserAnalysis.aggregate([
//       {
//         $group: {
//           _id: null,
//           avgHealth: { $avg: '$categoryScores.health' },
//           avgProductivity: { $avg: '$categoryScores.productivity' },
//           avgLearning: { $avg: '$categoryScores.learning' },
//           avgMindful: { $avg: '$categoryScores.mindful' },
//           avgFinance: { $avg: '$categoryScores.finance' },
//           avgSocial: { $avg: '$categoryScores.relationships' }
//         }
//       }
//     ]);
    
//     res.json({
//       success: true,
//       stats: {
//         totalUsers,
//         personaStats,
//         categoryAvgScores: categoryAvgScores[0] || {}
//       }
//     });
//   } catch (error) {
//     console.error('Survey stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get survey statistics'
//     });
//   }
// });

// Helper function to analyze user persona
function analyzeUserPersona(categoryScores) {
  const sortedCategories = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a);
  
  const topCategory = sortedCategories[0][0];
  const secondCategory = sortedCategories[1][0];
  
  // Define personas based on top categories
  const personaMap = {
    'health': 'health-focused',
    'productivity': 'productivity-driven',
    'learning': 'knowledge-seeker',
    'finance': 'wealth-builder',
    'relationships': 'social-connector',
    'mindful': 'mindful-living'
  };
  
  return personaMap[topCategory] || 'balanced-lifestyle';
}

// Helper function to get suggested habits
// async function getSuggestedHabits(userId, categoryScores, userPersona) {
//   // Get top 3 categories
//   const topCategories = Object.entries(categoryScores)
//     .sort(([,a], [,b]) => b - a)
//     .slice(0, 3)
//     .map(([category]) => category);
  
//   // Find habits that match user's top categories and persona
//   const suggestedHabits = await HabitSuggestion.find({
//     $or: [
//       { category: { $in: topCategories } },
//       { targetPersonas: userPersona }
//     ]
//   }).limit(10);
  
//   return suggestedHabits;
// }

export {
  getSurveyQuestions,
  submitSurvey,
  getUserSuggestions,
  getUserAnalysis,
  resetSurvey,
//getSurveyStats
};