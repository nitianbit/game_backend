import { User } from "../../db/models/User.js";
import { sendResponse } from "../../utils/helper.js";
import { getAllUsers, updateUser, deleteUser, getUser } from "./services.js";


export const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        sendResponse(res, 200, "Success", users)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

export const updateSingleUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, balance } = req.body;

        await updateUser(userId, { username, balance });

        return sendResponse(res, 200, "User updated successfully",)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

export const deleteSingleUser = async (req, res) => {
    try {
        const { userId } = req.params;

        await deleteUser(userId);
        sendResponse(res, 200, "User deleted successfully",)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}
export const getSingleUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await getUser(userId);
        sendResponse(res, 200, "User Fetched successfully", user)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}
