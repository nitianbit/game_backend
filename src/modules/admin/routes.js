import express from 'express'
import { getUsers, updateSingleUser, deleteSingleUser, getSingleUser } from './controller.js';
const adminRouter = express.Router();

adminRouter.post("/updateUser/:userId", updateSingleUser)
adminRouter.post("/deleteUser/:userId", deleteSingleUser)

adminRouter.get("/users-grid", getUsers)
adminRouter.get("/user/:userId", getSingleUser)

export default adminRouter;


