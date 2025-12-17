
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cấu hình dotenv để đọc file .env từ thư mục gốc BE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dburl = `mongodb+srv://${process.env.DB_Username}:${process.env.DB_Password}@cluster0.attlhny.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority&appName=Cluster0`;

// Định nghĩa model User tối giản để update
const userSchema = new mongoose.Schema({
    isBanned: Boolean,
    bannedReason: String,
    bannedUntil: Date,
}, { strict: false }); // strict false để không cần define hết fields

const User = mongoose.model('User', userSchema);

const banUser = async () => {
    try {
        await mongoose.connect(dburl);
        console.log('Connected to DB');

        const userId = '693cd3ef12158645cabb4bc9'; // User ID cần ban
        // const userId = '676100cbee04f447fce514d8';

        // Check user existence
        const user = await User.findById(userId);
        if (!user) {
            console.log(`User ${userId} not found!`);
            process.exit(1);
        }

        console.log(`Found user: ${user._id}`);

        // Update ban status
        const res = await User.findByIdAndUpdate(userId, {
            $set: {
                isBanned: true,
                bannedReason: 'Tài khoản đã bị cấm do vi phạm chính sách cộng đồng.',
                bannedUntil: null // Vĩnh viễn
            }
        }, { new: true });

        console.log('User banned successfully:', res);
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

banUser();
