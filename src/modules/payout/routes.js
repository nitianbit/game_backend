

import express from 'express'
import { createPayout, getPayouts, settlePayout } from './controller.js';
const payoutRouter = express.Router();

payoutRouter.post("/create", createPayout)
payoutRouter.get("/grid", getPayouts)

payoutRouter.put("/settle/:payoutId", settlePayout)

export default payoutRouter;


