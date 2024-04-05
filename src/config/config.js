import dotenv from 'dotenv';
import settings from '../../settings.js';
import path from 'path'

dotenv.config({ path: path.resolve(settings.PROJECT_DIR, `.env`) });

export const CONFIG = {
    PORT: process.env.PORT,
    MONGODB_URL: process.env.MONGODB_URL,
}