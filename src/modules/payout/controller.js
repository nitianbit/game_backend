import mongoose from "mongoose";
import { PAYOUT_STATUS, Payout } from "../../db/models/Payout.js";
import { USER_TYPE } from "../../db/models/User.js";
import { now, sendResponse } from "../../utils/helper.js";
import { getAllPayouts } from "./service.js";



export const getPayouts = async (req, res) => {
    try {
        //check here if user or admin has enterd and if user has done then add userId filter also
        const { page = 1, records = 20, status = "" } = req.query;
        let filters = {};
        if (req.query.status === 'pending') filters.status = PAYOUT_STATUS.CREATED;
        if (req.query.status === 'success') filters.status = PAYOUT_STATUS.SUCCESS;
        if (req.user.userType === USER_TYPE.USER) filters.userId = req.user._id;

        const payouts = await getAllPayouts(page, records, filters);
        sendResponse(res, 200, "Success", payouts)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

export const createPayout = async (req, res) => {
    try {
        const userId = req.user._id;
        //check if already a pending payout
        const pendingPayout = await Payout.findOne({ userId, status: PAYOUT_STATUS.CREATED });
        if (pendingPayout) return sendResponse(res, 400, "Already a pending payout");
        const { amount, UPI_ID } = req.body;
        if (!amount) return sendResponse(res, 400, "Amount is required");
        let data = {
            amount
        }
        if (UPI_ID) {
            data = {
                ...data,
                UPI_ID
            }
        }
        data = { ...data, userId, status: PAYOUT_STATUS.CREATED, initiatedAt: now() }
        const payout = await Payout.create(data);
        sendResponse(res, 200, "Success", payout)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

//admin only
export const settlePayout = async (req, res) => {
    try {
        const payoutId = req.params.payoutId;
        if (!mongoose.Types.ObjectId.isValid(payoutId)) return sendResponse(res, 400, "Invalid payout id");
        const payout = await Payout.findByIdAndUpdate(payoutId).lean();
        if (payout.status === PAYOUT_STATUS.SUCCESS) return sendResponse(res, 400, "Already settled");
        if (req.user.userType === USER_TYPE.USER) return sendResponse(res, 400, "Only Admin can settle payout");
        payout.status = PAYOUT_STATUS.SUCCESS;
        payout.completedAt = now();
        await payout.save();
        sendResponse(res, 200, "Success")
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}