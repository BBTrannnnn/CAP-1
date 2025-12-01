import Dream from '../models/Dream.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET SYSTEM DASHBOARD
export const getSystemDashboard = async (req, res, next) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });
    
    // Dream stats
    const totalDreams = await Dream.countDocuments();
    const dreamsToday = await Dream.countDocuments({
      analyzedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const dreamsThisWeek = await Dream.countDocuments({
      analyzedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const dreamsThisMonth = await Dream.countDocuments({
      analyzedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Retraining stats
    const needsRetraining = await Dream.countDocuments({ needsRetraining: true });
    const retrainingPercentage = totalDreams > 0 ? ((needsRetraining / totalDreams) * 100).toFixed(2) : 0;
    
    // Category distribution
    const categoryStats = await Dream.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Language distribution (approximate)
    const vietnameseDreams = await Dream.countDocuments({
      dreamText: { $regex: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i }
    });
    const englishDreams = totalDreams - vietnameseDreams;
    
    // Training data info
    const trainingDataPath = path.join(__dirname, '../../dream_training_data.json');
    let trainingDataSize = 0;
    let totalTrainingSamples = 0;
    
    try {
      const stats = fs.statSync(trainingDataPath);
      trainingDataSize = (stats.size / 1024 / 1024).toFixed(2); // MB
      
      const data = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
      totalTrainingSamples = data.length;
    } catch (error) {
      console.error('Error reading training data:', error);
    }
    
    // Model info
    const modelPath = path.join(__dirname, '../../trained_model/model.json');
    let modelInfo = null;
    try {
      const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      modelInfo = {
        format: modelData.format,
        generatedBy: modelData.generatedBy,
        convertedBy: modelData.convertedBy
      };
    } catch (error) {
      console.error('Error reading model info:', error);
    }
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
        },
        dreams: {
          total: totalDreams,
          today: dreamsToday,
          thisWeek: dreamsThisWeek,
          thisMonth: dreamsThisMonth,
          averagePerDay: dreamsThisWeek > 0 ? (dreamsThisWeek / 7).toFixed(2) : 0
        },
        retraining: {
          needsRetraining,
          alreadyTrained: totalDreams - needsRetraining,
          percentage: retrainingPercentage,
          recommendation: needsRetraining >= 100 ? 
            '✅ Ready to retrain - sufficient new data' :
            `⏳ Need ${100 - needsRetraining} more dreams`
        },
        categories: categoryStats.map(c => ({
          category: c._id,
          count: c.count,
          percentage: ((c.count / totalDreams) * 100).toFixed(2)
        })),
        languages: {
          vietnamese: {
            count: vietnameseDreams,
            percentage: ((vietnameseDreams / totalDreams) * 100).toFixed(2)
          },
          english: {
            count: englishDreams,
            percentage: ((englishDreams / totalDreams) * 100).toFixed(2)
          }
        },
        training: {
          dataSize: `${trainingDataSize} MB`,
          totalSamples: totalTrainingSamples,
          newSamples: needsRetraining,
          projectedTotal: totalTrainingSamples + needsRetraining
        },
        model: modelInfo,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET RECENT DREAMS (for monitoring)
export const getRecentDreams = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const dreams = await Dream.find()
      .sort({ analyzedAt: -1 })
      .limit(limit)
      .select('dreamText category confidence analyzedAt needsRetraining')
      .populate('userId', 'email username')
      .lean();
    
    res.status(200).json({
      success: true,
      data: dreams
    });
  } catch (error) {
    next(error);
  }
};

// GET TRAINING QUEUE
export const getTrainingQueue = async (req, res, next) => {
  try {
    const dreams = await Dream.find({ needsRetraining: true })
      .sort({ analyzedAt: -1 })
      .select('dreamText category confidence analyzedAt')
      .populate('userId', 'email username')
      .lean();
    
    // Group by category
    const byCategory = {};
    dreams.forEach(dream => {
      if (!byCategory[dream.category]) {
        byCategory[dream.category] = [];
      }
      byCategory[dream.category].push(dream);
    });
    
    res.status(200).json({
      success: true,
      data: {
        total: dreams.length,
        dreams: dreams.slice(0, 50), // Limit to 50 for performance
        byCategory: Object.keys(byCategory).map(cat => ({
          category: cat,
          count: byCategory[cat].length
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
