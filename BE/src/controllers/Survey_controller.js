import asyncHandler from "express-async-handler";
import { Question, SurveyResponse, UserAnalysis } from '../models/Survey.js';
import { surveyQuestions } from '../Script/seedSurvey.js';

// ✅ GIỮ - Get survey questions
const getSurveyQuestions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    questions: surveyQuestions,
    totalQuestions: surveyQuestions.length,
    categories: {
      health: surveyQuestions.filter(q => q.category === 'health').length,
      productivity: surveyQuestions.filter(q => q.category === 'productivity').length,
      learning: surveyQuestions.filter(q => q.category === 'learning').length,
      mindful: surveyQuestions.filter(q => q.category === 'mindful').length,
      finance: surveyQuestions.filter(q => q.category === 'finance').length,
      digital: surveyQuestions.filter(q => q.category === 'digital').length,
      social: surveyQuestions.filter(q => q.category === 'social').length,
      fitness: surveyQuestions.filter(q => q.category === 'fitness').length,
      sleep: surveyQuestions.filter(q => q.category === 'sleep').length,
      energy: surveyQuestions.filter(q => q.category === 'energy').length,
      control: surveyQuestions.filter(q => q.category === 'control').length
    }
  });
});

// ✅ GIỮ - Get random survey questions
const getRandomSurveyQuestions = asyncHandler(async (req, res) => {
  const numQuestions = parseInt(req.query.count) || 12;

  const questionsByCategory = {
    health: [],
    productivity: [],
    learning: [],
    mindful: [],
    finance: [],
    digital: [],
    social: [],
    fitness: [],
    sleep: [],
    energy: [],
    control: []
  };

  surveyQuestions.forEach(q => {
    if (questionsByCategory[q.category]) {
      questionsByCategory[q.category].push(q);
    }
  });

  const selectedQuestions = [];
  const categories = Object.keys(questionsByCategory);

  const selectedCategories = categories
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(8, categories.length));

  selectedCategories.forEach((cat, index) => {
    const categoryQuestions = questionsByCategory[cat];
    if (categoryQuestions.length === 0) return;

    const numQuestionsFromCat = index < 4 ? 2 : 1;
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
    
    selectedQuestions.push(...shuffled.slice(0, numQuestionsFromCat));
  });

  const finalQuestions = selectedQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, numQuestions);

  res.json({
    success: true,
    questions: finalQuestions,
    totalQuestions: finalQuestions.length,
    categoriesIncluded: [...new Set(finalQuestions.map(q => q.category))],
    message: `Selected ${finalQuestions.length} questions from ${new Set(finalQuestions.map(q => q.category)).size} categories`
  });
});

export {
  getSurveyQuestions,
  getRandomSurveyQuestions,
};