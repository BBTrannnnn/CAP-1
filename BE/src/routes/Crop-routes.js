import express from 'express';
import { createCrop, getAllCrops } from '../controllers/Crop_controller.js';
import { validateRequest } from '../../middlewares/validateReuqest.js';
const router = express.Router();


// Routes
router.post('/createCrop', validateRequest, createCrop);
router.get('/getAllCrops', getAllCrops);
export default router;