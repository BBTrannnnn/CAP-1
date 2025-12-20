import express from "express";
import authenticateToken from "../../middlewares/auth.js";
import { createNote, listNotes, updateNote, deleteNote } from "../controllers/Note_controller.js";

const router = express.Router();
router.post("/", authenticateToken, createNote);
router.get("/", authenticateToken, listNotes);
router.put("/:id", authenticateToken, updateNote);
router.delete("/:id", authenticateToken, deleteNote);
export default router;