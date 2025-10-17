import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import connectDB from './config/database.js';
import userRoutes from './routes/User-routes.js';
import SurveyRoutes from './routes/Survey-routes.js';
import HabitRoutes from './routes/Habit-routes.js';
import sleepRoutes from './routes/Sleep-routes.js';
import sleepContentRoutes from './routes/SleepContent-routes.js';
import aiRoutes from './routes/AI-routes.js';




dotenv.config();
const app = express();

connectDB();
app.use(cors());
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/survey', SurveyRoutes);

app.use('/api/habits', HabitRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/sleep-content', sleepContentRoutes);
app.use('/api/ai', aiRoutes);


app.use(errorHandler);



const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Lỗi kết nối server:', err);
  } else {
    console.log(` Server đang chạy tại: http://localhost:${PORT}`);
  }
});

