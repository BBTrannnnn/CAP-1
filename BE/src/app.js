import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import connectDB from './config/database.js';
import userRoutes from './routes/User-Routes.js';
import cropRoutes from './routes/Crop-routes.js';


dotenv.config();
const app = express();
connectDB();
app.use(cors());
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);
app.use(errorHandler);



const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối server:', err);
  } else {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  }
});

