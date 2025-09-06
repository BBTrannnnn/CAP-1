import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import userRoutes from './routes/User-Routes.js';


dotenv.config();
const app = express();
connectDB();
app.use(cors());
app.use(express.json());


app.use('/api/users', userRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối server:', err);
  } else {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  }
});

