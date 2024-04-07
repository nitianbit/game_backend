import { User } from "../../db/models/User.js";

export const getAllUsers = async () => {
    return await User.find().lean();
}

export const updateUser = async (userId, userData) => {
    await User.findByIdAndUpdate(userId, userData).lean();
}

export const deleteUser = async (userId) => {
    await User.findByIdAndDelete(userId).lean();
}