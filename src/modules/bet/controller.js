import { placeBet } from '../services/betService.js';
import { Bet } from '../models/Bet.js';
import { Contest, CONTEST_STATUS } from '../../db/models/Contest.js';
import { sendResponse } from '../../utils/helper.js';
import { User } from '../../db/models/User.js';

export const placeBet = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { number, amount } = req.body;
        if (!number || !amount || number < 0 || number > 10) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the correct details.");
        }
        const currentContest = await Contest.findOne({ status: CONTEST_STATUS.RUNNING });
        if (!currentContest) {
            return sendResponse(res, 400, "No contest currently ongoing");
        }
        if (!userId) {
            return sendResponse(res, 400, "Invalid user");
        }
        const user = await User.findById(userId).lean()
        //check balance of user also
        //here we can also add min amount in contest
        if (user.balance < amount) {
            return sendResponse(res, 400, "Insufficient balance")
        }
        const contestId = currentContest._id;
        const bet = new Bet({
            userId,
            contestId,
            number,
            amount
        });
        await placeBetService(bet);
        sendResponse(res, 200, "Bet placed successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
};
