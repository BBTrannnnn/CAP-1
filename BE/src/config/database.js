const mongoose = require('mongoose');
require('dotenv').config();

const dburl= `mongodb+srv://${process.env.DB_Username}:${process.env.DB_Password}@cluster0.attlhny.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const connectDB = async (app) => {
    try {   
        const connection = await mongoose.connect(dburl);
        console.log('MongoDB connected successfully');
        
} catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
module.exports = connectDB;