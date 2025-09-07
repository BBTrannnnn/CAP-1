import express from "express";
import { register,getAllUsers,getProfileById, updateProfileById,deleteProfileById} from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";

const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 router.get('/getAllUsers',getAllUsers);
 router.put('/profile/:id',validateRequest,updateProfileById);
 router.get('/profile/:id',getProfileById);
 router.delete('/:id',deleteProfileById);

export default router;