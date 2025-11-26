import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import {
    getInventory,
    useShield,
    useFreezeToken,
    useReviveToken,
    getProtectionSettings,
    updateProtectionSettings,
    testAllItems
} from '../controllers/Inventory_controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getInventory);
router.post('/use-shield', useShield);
router.post('/use-freeze', useFreezeToken);
router.post('/use-revive', useReviveToken);
router.get('/settings', getProtectionSettings);
router.put('/settings', updateProtectionSettings);

// Test endpoint
router.post('/test-all-items', testAllItems);

export default router;