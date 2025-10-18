import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import { Question, HabitSuggestion } from '../models/Survey.js';
import { HabitTemplate } from '../models/Habit.js';
import {
    surveyQuestions,
    habitSuggestions,
    habitTemplates,
} from './seedSurvey.js'; 

dotenv.config();

// Import dữ liệu mẫu


const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('✅ Đã kết nối MongoDB thành công');

        // Xóa dữ liệu cũ
        await Question.deleteMany({});
        await HabitTemplate.deleteMany({});
        await HabitSuggestion.deleteMany({});
        console.log('🧹 Đã xóa dữ liệu cũ trong database');

        // Thêm mới dữ liệu
        await Question.insertMany(surveyQuestions);
        console.log(`📋 Đã thêm ${surveyQuestions.length} câu hỏi khảo sát`);

        await HabitTemplate.insertMany(habitTemplates);
        console.log(`💡 Đã thêm ${habitTemplates.length} mẫu thói quen`);

        await HabitSuggestion.insertMany(habitSuggestions);
        console.log(`✨ Đã thêm ${habitSuggestions.length} gợi ý thói quen`);

        console.log('🎉 Seed database hoàn tất!');
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Đã đóng kết nối MongoDB');
    }
};

seedDatabase();
