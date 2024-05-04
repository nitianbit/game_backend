import mongoose from "mongoose";
import { Bet } from "../../db/models/Bets.js";
import { CONTEST_STATUS, Contest } from "../../db/models/Contest.js";
import { User } from "../../db/models/User.js";
import { now } from "../../utils/helper.js";

//TODO handle that case that if backend collapse then current contest data will be lost so check db for current contest also using timestamp
class ContestManager {
    constructor() {
        this.data = {
            currentContest: null
        }
    }

    //db method
    createContest = async () => {
        const newContest = new Contest({
            status: 1,
            startTime: now()
        });
        await newContest.save();
        return newContest.toObject();
    }

    //db method
    updateContest = async (contestId, updatedData) => {
        const response = await Contest.findByIdAndUpdate(contestId, updatedData);
        return response;
    }

    updateContestWinningNumber = async (id, winningNumber) => {
        if (this.data.currentContest) {
            const contestId = this.data.currentContest._id;
            if (id !== contestId) return null;
            const response = await this.updateContest(contestId, { winningNumber, modifiedByAdmin: true });
            return response;
        }
        return null;
    }

    startNewContest = async (hardUpdate = false) => {
        if (!this.data.currentContest || hardUpdate) {
            const newContest = await this.createContest();
            this.data.currentContest = newContest;
        }
        return this.data.currentContest;
    }

    closePreviousContest = async (contestId) => {
        //TODO fetch winner and update and all other things
        const updateObj = {
            status: CONTEST_STATUS.ENDED
        };
        const response = await this.updateContest(contestId, updateObj);
        return response;
    }

    currentOnGoingContest = async () => {
        if (!this.data.currentContest) {
            //check in db if there is current contest goingon then use that else create one
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $gte: now() - 1000 * 60 }
            }).lean();
            if (currentContest) {
                this.data.currentContest = currentContest;
                return currentContest;
            }
            return await this.startNewContest();
        }
        return this.data.currentContest;
    }

    //in map format and each number contain total bet and total amount
    getBetSummaryByNumber = async (contestId = "") => {
        const betSummary = await Bet.aggregate([
            { $match: { contestId: new mongoose.Types.ObjectId(contestId) } },
            {
                $group: {
                    _id: '$number',
                    totalCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const betSummaryMap = new Map();
        for (let i = 1; i <= 10; i++) {
            betSummaryMap.set(i, { totalCount: 0, totalAmount: 0 });
        }

        betSummary.forEach((entry) => {
            const { _id, totalCount, totalAmount } = entry;
            betSummaryMap.set(_id, { totalCount, totalAmount });
        });

        return Object.fromEntries(betSummaryMap);
    }

    calculateWinningNumber = async (contestId) => {
        const bets = await this.getBetSummaryByNumber(contestId);

        let lowestAmount = Infinity;
        const betsArray = [];

        //fetch the lowest amount
        Object.entries(bets).forEach(([betNumber, bet]) => {
            const { totalCount, totalAmount } = bet;
            if (totalAmount <= lowestAmount) {
                lowestAmount = totalAmount;
            }
            betsArray.push({ number: betNumber, totalCount, totalAmount });
        });

        const betsWithLowestAmount = betsArray.filter(bet => bet.totalAmount === lowestAmount);
        let winningNumber = null;

        if (betsWithLowestAmount.length > 1) {
            const randomIndex = Math.floor(Math.random() * betsWithLowestAmount.length);
            winningNumber = betsWithLowestAmount[randomIndex].number;
        } else if (betsWithLowestAmount.length) {
            winningNumber = betsWithLowestAmount[0].number;
        }
        return { winningNumber, winningAmount: lowestAmount };


    }

    fetchWinnerUserIds = async (contestId, winningNumber) => {
        const users = await Bet.find({ contestId, number: winningNumber }).lean();
        if (users.length) {
            return users.map(user => user._id);
        }
        return [];
    }
    updateWinnerUserIdsBalance = async (usersIds, amount) => {
        const response = await User.updateMany(
            { _id: { $in: usersIds } },
            { $inc: { balance: amount } }).lean();
        return response;
    }

    getCurrentContest = async () => {
        if (!this.data.currentContest) {
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $lte: now() },
            }).lean();

            if (currentContest) {
                this.data.currentContest = currentContest;
                return currentContest;
            }
            return null;
        }
        return this.data.currentContest;
    }



}

const contestManager = new ContestManager();
Object.freeze(contestManager);
export {
    contestManager
};

export const getAllContests = async (page, limit) => {
    //populate winner name maybe?
    try {
        let request = Contest.find();
        if (page !== -1) {
            const skip = (page - 1) * limit;
            request = request.skip(skip);
        }
        let data = {
            rows: await request.lean()
        }

        if (page === 1) {
            const total = await Contest.countDocuments();
            data = { ...data, total };
        }
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}