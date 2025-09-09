import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import connectDB from './config/database.js';
import userRoutes from './routes/User-routes.js';
import cropRoutes from './routes/Crop-routes.js';


dotenv.config();
const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
connectDB();
app.use(cors());
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);
app.use(errorHandler);



const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Lỗi kết nối server:', err);
  } else {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  }
});

