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

    if (!userId) return sendResponse(res, 400, "Invalid user");
    if (!amount || amount <= 0) return sendResponse(res, 400, "Invalid amount");

    // validate numbers
    if (kind === BET_TYPE.SINGLE_BET) {
      if (number === undefined || number === null || number < 0 || number > 10) {
        return sendResponse(res, 400, "Invalid number");
      }
    } else if (!numbers?.length) {
      return sendResponse(res, 400, "Invalid numbers");
    }

    // get contest
    const currentContest = await contestManager.currentOnGoingContest();
    if (!currentContest) return sendResponse(res, 400, "No contest currently ongoing");

    const contestId = currentContest._id;

    // 🔥 Atomic balance check + deduction
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } }, // condition: balance >= amount
      { $inc: { balance: -amount } },             // atomic deduction
      { new: true }
    );

    if (!updatedUser) {
      return sendResponse(res, 400, "Insufficient balance");
    }

    // create bet(s)
    const bet = {
      userId,
      contestId,
      amount: numbers?.length > 0 ? amount / numbers.length : amount,
      kind
    };

    if (numbers.length) {
      await Promise.all(numbers.map(num => createBet({ ...bet, number: num })));
    } else {
      await createBet({ ...bet, number });
    }

    // get updated bet summary
    const betSummary = await contestManager.getBetSummaryUserForCurrentContest({
      userId,
      fromCache: false
    });

    return sendResponse(
      res,
      200,
      `Bet placed successfully on ${
        kind !== BET_TYPE.SINGLE_BET ? numbers.join(",") : number
      } of amount ${amount}`,
      { balance: updatedUser.balance, betSummary }
    );
  } catch (error) {
    console.error("placeBet error:", error);
    return sendResponse(res, 500, "Internal server error", error);
  }
};

export const cancelBet = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { number, betIds,all=false } = req.body;
        if (((number==null || number==undefined) && (!betIds?.length)) && !all) {
            return sendResponse(res, 400, "Invalid Bet. Please provide the correct details.");
        }
        const currentContest = await contestManager.currentOnGoingContest();
        if (!currentContest) {
            return sendResponse(res, 400, "No contest currently ongoing");
        }
        if (!userId) {
            return sendResponse(res, 400, "Invalid user");
        }
        if(all){//cancel all bets in one go
            const bets=await Bet.find({ contestId: currentContest._id,userId }).lean()
            await Bet.deleteMany({ userId, contestId: currentContest._id }).lean()
            const amount=bets?.reduce((prev,curr)=>prev+curr.amount??0,0)
            await User.findByIdAndUpdate(userId, { $inc: {balance: amount} });
            const betSummary = await contestManager.getBetSummaryUserForCurrentContest({userId,fromCache:false})//update cache
            sendResponse(res, 200, "Bet cancelled successfully", betSummary);
            return
        }else if(number){
            const bets =await Bet.find({userId,number:number,contestId: currentContest._id}).lean()
            let amountToAdd = 0;
            if (bets.length) {
                amountToAdd = bets.reduce((curr, prev) => curr + prev?.amount, 0)
            }
            await Bet.deleteMany({ userId, number: number, contestId: currentContest._id });
            await User.findByIdAndUpdate(userId, { $inc: { balance: amountToAdd } });
            const betSummary = await contestManager.getBetSummaryUserForCurrentContest({userId,fromCache:false})//update cache
            return sendResponse(res, 200, "Bet cancelled successfully", betSummary);
        }
        const bet=await Bet.findOneAndDelete({ _id: { $in: betIds }, userId }).lean()
        await User.findByIdAndUpdate(userId, { $inc: {balance: bet.amount} });
        const betSummary = await contestManager.getBetSummaryUserForCurrentContest({userId,fromCache:false})//update cache
        sendResponse(res, 200, "Bet cancelled successfully", betSummary);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
};

export const betSummaryofUser = async (req, res) => {
    try {
        const userId = req.user?._id;
        const betSummary = await contestManager.getBetSummaryUserForCurrentContest({userId})//only return and don't update cache
        sendResponse(res, 200, "Bet placed successfully", betSummary);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, "Internal server error", error);
    }
}