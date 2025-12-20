import express from "express";
import authenticateToken from "../../middlewares/auth.js";
import { createSleepLog, listSleepLogs, sleepStats, updateSleepLog, deleteSleepLog, evaluateSleepByDate } from "../controllers/Sleep_controller.js";

const router = express.Router();
router.post("/logs", authenticateToken, createSleepLog);
router.get("/logs", authenticateToken, listSleepLogs);
router.put("/logs/:id", authenticateToken, updateSleepLog);
router.delete("/logs/:id", authenticateToken, deleteSleepLog);
router.get("/stats", authenticateToken, sleepStats);
router.get("/evaluate-by-date", authenticateToken, evaluateSleepByDate);
export default router;
