import { sendResponse } from "../../utils/helper.js";
import { decodeToken } from "../auth/services.js";



export const verifyToken = (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) return sendResponse(res, 401, "UnAuthorized.");
        const decodedData = decodeToken(token);
        if (!decodedData.success) return sendResponse(res, 401, "UnAuthorized.");
        req.user = decodedData.data;
        next();
    } catch (error) {
        console.log(error)
        return sendResponse(res, 500, "Internal Server Error", error);
    }
}