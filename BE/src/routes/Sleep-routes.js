import express from "express";
import authenticateToken from "../../middlewares/auth.js";
import { createSleepLog, listSleepLogs, sleepStats } from "../controllers/Sleep_controller.js";

const router = express.Router();
router.post("/logs", authenticateToken, createSleepLog);
router.get("/logs", authenticateToken, listSleepLogs);
router.get("/stats", authenticateToken, sleepStats);
export default router;
