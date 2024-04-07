import express from 'express'
import { getUsers, updateUser, deleteUser } from './controller.js';
const adminRouter = express.Router();

adminRouter.post("/updateUser", updateUser)
adminRouter.post("/deleteUser", deleteUser)

adminRouter.get("/getUser", getUsers)

export default adminRouter;


