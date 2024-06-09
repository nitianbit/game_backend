import { createBet } from './services.js';
import { Contest, CONTEST_STATUS } from '../../db/models/Contest.js';
import { sendResponse } from '../../utils/helper.js';
import { User } from '../../db/models/User.js';
import { contestManager } from '../contest/services.js';
import { Bet } from '../../db/models/Bets.js';
import { BET_TYPE } from '../../utils/constants.js';

export const placeBet = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { number, amount, numbers = [], kind = BET_TYPE.SINGLE_BET } = req.body;
        if (!amount) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the valid amount.");
        }
        if (kind == BET_TYPE.SINGLE_BET && ((number < 0 || number > 10) || number === undefined || number == null)) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the valid number.");
        }
        if (kind > BET_TYPE.SINGLE_BET && !numbers?.length) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the valid numbers.");
        }
        //TODO here also ftch from class instance
        const currentContest = await contestManager.currentOnGoingContest();
        if (!currentContest) {
            return sendResponse(res, 400, "No contest currently ongoing");
        }
        if (!userId) {
            return sendResponse(res, 400, "Invalid user");
        }
        const user = await User.findById(userId).lean()
        if (!user) {
            return sendResponse(res, 404, 'User not Found')
        }
        //check balance of user also
        //here we can also add min amount in contest
        if (user.balance < amount) {
            return sendResponse(res, 400, "Insufficient balance")
        }
        const contestId = currentContest._id;
        const bet = {
            userId,
            contestId,
            ...((kind == BET_TYPE.SINGLE_BET) && { number }),
            amount: numbers?.length > 0 ? (amount / (numbers.length)) : amount
        };
        if (numbers.length) {
            await Promise.all(numbers.map((number) => createBet({ ...bet, number, kind })))
        } else {
            await createBet(bet);
        }
        await User.findByIdAndUpdate(user._id, { balance: user.balance - amount });
        //get bet summary and return
        const betSummary = await contestManager.getBetSummaryUserForCurrentContest({ userId, fromCache: false })//update cache
        sendResponse(res, 200, `Bet placed successfully on ${kind !== BET_TYPE.SINGLE_BET ? numbers.join(',') : number} of amount ${amount}`, betSummary);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
};
export const cancelBet = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { number, betIds, all = false } = req.body;
        if ((number == null || number == undefined || (!betIds?.length)) && !all) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the correct details.");
        }
        const currentContest = await contestManager.currentOnGoingContest();
        if (!currentContest) {
            return sendResponse(res, 400, "No contest currently ongoing");
        }
        if (!userId) {
            return sendResponse(res, 400, "Invalid user");
        }
        if (all) {//cancel all bets in one go
            const bets = await Bet.find({ contestId: currentContest._id, userId }).lean()
            await Bet.deleteMany({ userId, contestId: currentContest._id }).lean()
            const amount = bets?.reduce((prev, curr) => prev + curr.amount ?? 0, 0)
            await User.findByIdAndUpdate(userId, { $inc: { balance: amount } });
            const betSummary = await contestManager.getBetSummaryUserForCurrentContest({ userId, fromCache: false })//update cache
            sendResponse(res, 200, "Bet cancelled successfully", betSummary);
            return
        }
        const bet = await Bet.findOneAndDelete({ _id: { $in: betIds }, userId }).lean()
        await User.findByIdAndUpdate(userId, { $inc: { balance: bet.amount } });
        const betSummary = await contestManager.getBetSummaryUserForCurrentContest({ userId, fromCache: false })//update cache
        sendResponse(res, 200, "Bet cancelled successfully", betSummary);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
};

export const betSummaryofUser = async (req, res) => {
    try {
        const userId = req.user?._id;
        const betSummary = await contestManager.getBetSummaryUserForCurrentContest({ userId })//only return and don't update cache
        sendResponse(res, 200, "Bet placed successfully", betSummary);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
}