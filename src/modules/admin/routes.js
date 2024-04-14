import express from 'express'
import { getUsers, updateUser, deleteUser } from './controller.js';
const adminRouter = express.Router();

adminRouter.post("/updateUser/:userId", updateUser)
adminRouter.post("/deleteUser/:userId", deleteUser)

adminRouter.get("/users-grid", getUsers)
adminRouter.get("/user/:userId", getUsers)

export default adminRouter;


