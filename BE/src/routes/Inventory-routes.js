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

// Inventory
router.get('/', getInventory);

// Use items
router.post('/use-shield', useShield);
router.post('/use-freeze', useFreezeToken);
router.post('/use-revive', useReviveToken);

// Protection settings
router.get('/protection-settings', getProtectionSettings);
router.put('/protection-settings', updateProtectionSettings);

// Test endpoint
router.post('/test-all-items', testAllItems);

export default router;