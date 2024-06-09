import { User } from "../../db/models/User.js";

export const getAllUsers = async (page, limit, filters = {}) => {
    //if page ==-1 return all users else pagination
    let request = User.find(filters).select("-password -userType");
    if (page !== -1) {
        const skip = (page - 1) * limit;
        request = request.skip(skip).limit(limit);
    }
    let data = {
        rows: await request.lean()
    }

    if (page == 1) {
        const total = await User.countDocuments(filters);
        data = { ...data, total };
    }
    return data;
}

export const updateUser = async (userId, userData) => {
    const response = await User.findByIdAndUpdate(userId, userData).lean();
    return response
}

export const deleteUser = async (userId) => {
    await User.findByIdAndDelete(userId).lean();
}
export const getUser = async (userId) => {
    await User.findById(userId).select("-password").lean();
}