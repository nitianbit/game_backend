import { Payout } from "../../db/models/Payout.js";


export const getAllPayouts = async (page, limit, filters = {}) => {
    let request = Payout.find(filters).populate({
        path: 'userId',
        select: '-password'
    })
    if (page !== -1) {
        const skip = (page - 1) * limit;
        request = request.skip(skip);
    }
    let data = {
        rows: await request.lean()
    }

    if (page == 1) {
        const total = await Payout.countDocuments(filters);
        data = { ...data, total };
    }
    return data;
}