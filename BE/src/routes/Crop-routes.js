import express from 'express';
import { createCrop, getAllCrops,deleteCropById,updateCropById} from '../controllers/Crop_controller.js';
import { validateRequest } from '../../middlewares/validateReuqest.js';
const router = express.Router();


// Routes
router.post('/create', validateRequest, createCrop);
router.get('/', getAllCrops);
router.delete('/:id', deleteCropById);
router.put('/:id', updateCropById);
export default router;