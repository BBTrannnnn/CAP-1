import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import userRoutes from './routes/User-routes.js';
import SurveyRoutes from './routes/Survey-routes.js';
import HabitRoutes from './routes/Habit-routes.js';
import sleepRoutes from './routes/Sleep-routes.js';
import sleepContentRoutes from './routes/SleepContent-routes.js';
import sleepSupportRoutes from './routes/SleepSupport-routes.js';




dotenv.config();
const app = express();

connectDB();
app.use(cors());
app.use(express.json());

// Static: serve audio files for sleep content
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioDir = path.join(__dirname, '..', 'public', 'audio');
app.use('/audio', express.static(audioDir));


app.use('/api/users', userRoutes);
app.use('/api/survey', SurveyRoutes);

app.use('/api/habits', HabitRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/sleep-content', sleepContentRoutes);
app.use('/api/sleep-support', sleepSupportRoutes);


app.use(errorHandler);



const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Lỗi kết nối server:', err);
  } else {
    console.log(` Server đang chạy tại: http://localhost:${PORT}`);
  }
});

