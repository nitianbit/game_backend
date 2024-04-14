import { USER_TYPE, User } from "../../db/models/User.js";
import { sendResponse } from "../../utils/helper.js"
import { comparePassword, createToken, encryptPassword } from "./services.js";

export const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) return sendResponse(res, 400, "Invalid Request. Please send all the details.");

        const user = await User.findOne({ phone }).lean();
        if (!user) {
            return sendResponse(res, 400, "User not found.");
        }
        const isPassMatched = comparePassword(password, user.password);
        if (!isPassMatched) {
            return sendResponse(res, 400, "Wrong password.");
        }

        const token = createToken({
            _id: user._id,
            phone: user.phone,
            countryCode: user.countryCode,
            userType: user.userType,
        });

        return sendResponse(res, 200, "Success", {
            token: token
        })

    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal Server Error", error);
    }
}

export const signup = async (req, res) => {
    try {
        const { phone, password, name } = req.body;
        if (!phone || !password || !name) return sendResponse(res, 400, "Invalid Request. Please send all the details.");

        const user = await User.findOne({ phone }).lean();
        if (user) {
            return sendResponse(res, 400, "User already present.");
        }
        const hashedPassword = encryptPassword(password);

        //check header here if x-api-key present then it is admin else user
        const xApiKey = req.headers['x-api-key'];

        const newUser = new User({
            name: name,
            phone: phone,
            password: hashedPassword,
            countryCode: 91,
            userType: xApiKey === 'web' ? USER_TYPE.ADMIN : USER_TYPE.USER
        })
        await newUser.save();
        return sendResponse(res, 200, "Success. User Registed", {})
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal Server Error", error);
    }
}


export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -userType").lean();
        return sendResponse(res, 200, "Success", user)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal Server Error", error);
    }
}

export const adminLogin = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) return sendResponse(res, 400, "Invalid Request. Please send all the details.");

        const user = await User.findOne({ phone }).lean();
        if (!user) {
            return sendResponse(res, 400, "User not found.");
        }
        if (user.userType !== USER_TYPE.ADMIN) {
            return sendResponse(res, 400, 'Only Admins are allowed for this operation.')
        }
        const isPassMatched = comparePassword(password, user.password);
        if (!isPassMatched) {
            return sendResponse(res, 400, "Wrong password.");
        }

        const token = createToken({
            _id: user._id,
            phone: user.phone,
            countryCode: user.countryCode,
            userType: user.userType,
        });

        return sendResponse(res, 200, "Success", {
            token: token
        })

    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal Server Error", error);
    }
}