
import mongoose from "mongoose";
import { CONFIG } from "../config/config.js";

export const connectDB = async () => {
    let conn = null;
    try {
        conn = await mongoose.connect(CONFIG.MONGODB_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log(`MongoDB connected : ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error while connecting mongodb : ${error.message}`);
        process.exit(1);
    }
    return conn;
};