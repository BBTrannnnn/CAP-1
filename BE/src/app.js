import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import connectDB from './config/database.js'; // ← Import connectDB
import './config/firebase.js'; 


// Routes
import userRoutes from './routes/User-routes.js';
import SurveyRoutes from './routes/Survey-routes.js';
import HabitRoutes from './routes/Habit-routes.js';
import sleepRoutes from './routes/Sleep-routes.js';
import sleepContentRoutes from './routes/SleepContent-routes.js';
import dreamRoutes from './routes/Dream-routes.js';
import aiHabitRoutes from './routes/aiHabit_routes.js';
import aiRoutes from './routes/AI-routes.js';
import fcmRoutes from './routes/fcmRoutes.js';
import testRoutes from './routes/testRoutes.js';

import reminderScheduler from './services/reminderScheduler.js';
import streakProtectionScheduler from './jobs/streakProtectionScheduler.js';
import mongoose from 'mongoose';
import achievementRoutes from './routes/Achievement-routes.js'; 
import inventoryRoutes from './routes/Inventory-routes.js'; 

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/survey', SurveyRoutes);
app.use('/api/habits', HabitRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/sleep-content', sleepContentRoutes);
app.use('/api/ai-habit', aiHabitRoutes);
app.use('/api/dreams', dreamRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/test', testRoutes);

app.use('/api/achievements', achievementRoutes);
app.use('/api/inventory', inventoryRoutes);

// Error handler
app.use(errorHandler);

// Connect to MongoDB và start server
const PORT = process.env.PORT || 5000;

// ✅ THAY ĐỔI Ở ĐÂY - Dùng connectDB() thay vì mongoose.connect()
connectDB().then(() => {
  console.log('✅ Database connection successful');
  
  // Khởi động reminder scheduler
  reminderScheduler.start();

  streakProtectionScheduler.start();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received');
  console.log('Stopping reminder scheduler...');
  reminderScheduler.stop();
  
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received');
  console.log('Stopping reminder scheduler...');
  reminderScheduler.stop();
  
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});