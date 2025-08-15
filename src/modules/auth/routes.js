import express from 'express'
import { getProfile, login, signup, adminLogin } from './controller.js';
const authRouter = express.Router();

authRouter.post("/login", login)
authRouter.post("/adminLogin", adminLogin)
authRouter.post("/signup", signup)

authRouter.get("/get", getProfile)

export default authRouter;


