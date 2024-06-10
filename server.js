import express from 'express'
const app = express();

import dotenv from 'dotenv';
import path from 'path'
import cors from 'cors'

import { CONFIG } from './src/config/config.js';
import settings from './settings.js';
import { connectDB } from './src/db/index.js';
import { authRoutes, protectedRoutes } from './src/routes/index.js';
import { verifyToken } from "./src/modules/middlewares/index.js";
import cron from 'node-cron';
import { endPreviousAndCreateNew } from './src/modules/contest/controllers.js';
import { contestManager } from './src/modules/contest/services.js';
import PaymentTransaction from './src/db/models/PaymentTransaction.js';
import { test } from './src/test.js';

dotenv.config({ path: path.resolve(settings.PROJECT_DIR, `.env`) });

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

connectDB()


authRoutes(app);

app.use(verifyToken);
protectedRoutes(app)





app.listen(CONFIG.PORT, () => console.log(`Server running on port ${CONFIG.PORT}`))

// cron.schedule('* * * * *', () => {
//     console.log('running a task every minute');
//     endPreviousAndCreateNew()
// });

test()