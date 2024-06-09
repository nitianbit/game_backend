import dotenv from 'dotenv';
import settings from '../../settings.js';
import path from 'path'

dotenv.config({ path: path.resolve(settings.PROJECT_DIR, `.env`) });

const STORAGE_KEYS={
    BET_SUMMARY:'BET_SUMMARY',
 }


export const CONFIG = {
    PORT: process.env.PORT,
    MONGODB_URL: process.env.MONGODB_URL,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    RAZORPAY_KEY: process.env.RAZORPAY_KEY,
    RAZORPAY_SECRET: process.env.RAZORPAY_SECRET,
    STORAGE_KEYS:STORAGE_KEYS
}