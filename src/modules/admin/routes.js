import express from 'express'
import { getUsers, updateSingleUser, deleteSingleUser, getSingleUser } from './controller.js';
const adminRouter = express.Router();

adminRouter.post("/updateUser/:userId", updateSingleUser)
adminRouter.delete("/deleteUser/:userId", deleteSingleUser)

adminRouter.get("/grid", getUsers)
adminRouter.get("/user/:userId", getSingleUser)

export default adminRouter;


