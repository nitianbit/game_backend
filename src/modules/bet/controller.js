import { placeBet } from '../services/betService';
import { Bet } from '../models/Bet';
import { Contest, CONTEST_STATUS } from '../../db/models/Contest';
import { sendResponse } from '../../utils/helper';

export const placeBet = async (req, res) => {
    try {
        const userId = req.user?._id;

        const currentContest = await Contest.findOne({ status: CONTEST_STATUS.RUNNING });

        if (!currentContest) {
            return sendResponse(res, 400, "No contest currently ongoing");
        }

        // const user = await getUserById(userId);
        if (!userId) {
            return sendResponse(res, 400, "Invalid user");
        }

        const contestId = currentContest._id;

        const { number, amount } = req.body;

        if (number < 0 || number > 10) {
            return sendResponse(res, 400, "Invalid bet number");
        }

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
