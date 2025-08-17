import express from 'express';
const app = express();

import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import cron from 'node-cron';
import settings from './settings.js';
import { CONFIG } from './src/config/config.js';
import { connectDB } from './src/db/index.js';
import { endPreviousAndCreateNew } from './src/modules/contest/controllers.js';
import { verifyToken } from "./src/modules/middlewares/index.js";
import { authRoutes, protectedRoutes } from './src/routes/index.js';
import socketService from './src/services/socket.js';
import { test } from './src/test.js';
import { CronExpression } from './src/utils/constants.js';
import http from 'http';
const server = http.createServer(app);          // <-- single server

dotenv.config({ path: path.resolve(settings.PROJECT_DIR, `.env`) });

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

connectDB()


authRoutes(app);

app.use(verifyToken);
protectedRoutes(app)



socketService.initialize(server);

server.listen(CONFIG.PORT, () => console.log(`Server running on port ${CONFIG.PORT}`))

cron.schedule(CronExpression.EVERY_2_SECONDS, () => {
    console.log('running a task every minute',new Date());
    endPreviousAndCreateNew()
});

test()