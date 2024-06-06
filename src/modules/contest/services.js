import mongoose from "mongoose";
import { Bet } from "../../db/models/Bets.js";
import { CONTEST_STATUS, Contest } from "../../db/models/Contest.js";
import { User } from "../../db/models/User.js";
import { now } from "../../utils/helper.js";
import { BET_TYPE } from "../../utils/constants.js";
import fs from 'fs'

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

    getPrizeByKind=(amount,kind)=>{
        switch (kind) {
            case BET_TYPE.SINGLE_BET:
                return (amount*9.6).toFixed(2);
            case BET_TYPE.SMALL_CAP:
                return (amount*2.4).toFixed(2);
            case BET_TYPE.MID_CAP:
                return (amount*4.8).toFixed(2);
            case BET_TYPE.LARGE_CAP:
                return (amount*2.4).toFixed(2);
            default:
                return (amount*9.6).toFixed(2);
        }
    }

    currentOnGoingContest = async () => {
        if (!this.data.currentContest) {
            //check in db if there is current contest goingon then use that else create one
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $gte: now() - 1000 * 60 }
            }).lean();
            if (currentContest) {
                //TODO check if time not over and make the creating method single to avaoid multiple instance if both this function and scheduler run at same time
                this.data.currentContest = currentContest;
                return currentContest;
            }
            return await this.startNewContest();
        }
        return this.data.currentContest;
    }

    //in map format and each number contain total bet and total amount
    getBetSummaryByNumber = async (contestId = "", userId = "") => {
        const betSummary = await Bet.aggregate([
            { 
                $match: { 
                    contestId: new mongoose.Types.ObjectId(contestId), 
                    ...(userId && { userId: new mongoose.Types.ObjectId(userId) }) 
                } 
            },
            {
                $addFields: {
                    prizeMultiplier: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$kind", BET_TYPE.SINGLE_BET] }, then: 9.6 },
                                { case: { $eq: ["$kind", BET_TYPE.SMALL_CAP] }, then: 2.4 },
                                { case: { $eq: ["$kind", BET_TYPE.MID_CAP] }, then: 4.8 },
                                { case: { $eq: ["$kind", BET_TYPE.LARGE_CAP] }, then: 2.4 }
                            ],
                            default: 9.6
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { number: '$number', kind: '$kind' },  // Group by both number and kind
                    countByKind: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalBetAmount: { $sum: { $multiply: ['$amount', '$prizeMultiplier'] } },
                    ...(userId && { betIds: { $push: '$_id' } })
                }
            },
            {
                $group: {
                    _id: '$_id.number',  // Regroup by number
                    kinds: {
                        $push: {
                            kind: { $toString: '$_id.kind' },  // Ensure kind is a string
                            countByKind: '$countByKind',
                            totalAmount: '$totalAmount',//here totalamount is for a kind
                            totalBetAmount: '$totalBetAmount'//here totalbetamount is for a kind
                        }
                    },
                    totalCount: { $sum: '$countByKind' },  // Sum counts from all kinds for the total count
                    totalAmount: { $sum: '$totalAmount' },  // Sum total amounts from all kinds
                    totalBetAmount: { $sum: '$totalBetAmount' },  // Sum total bet amounts from all kinds
                    // ...(userId && { betIds: { $concatArrays: '$betIds' } })  
                }
            }
        ]);    

        const betSummaryMap = new Map();
        for (let i = 0; i < 9; i++) {
            betSummaryMap.set(i, { totalCount: 0, totalAmount: 0,totalPayAbleAmount:0 });
        }

        betSummary.forEach((entry) => {
            const { _id, totalCount, totalAmount,totalBetAmount } = entry;
            betSummaryMap.set(_id, { totalCount, totalAmount, betIds: entry?.betIds ?? [],totalPayAbleAmount:totalBetAmount,kinds:entry?.kinds??[] });
        });

        return Object.fromEntries(betSummaryMap);
    }

    calculateWinningNumber = async (contestId) => {
        const bets = await this.getBetSummaryByNumber(contestId);

        let lowestAmount = Infinity;
        const betsArray = [];

        //fetch the lowest amount
        Object.entries(bets).forEach(([betNumber, bet]) => {
            const { totalCount, totalAmount ,totalPayAbleAmount} = bet;
            if (totalPayAbleAmount <= lowestAmount) {
                lowestAmount = totalPayAbleAmount;
            }
            betsArray.push({ number: betNumber, totalCount, totalAmount,totalPayAbleAmount });
        });

        const betsWithLowestAmount = betsArray.filter(bet => bet.totalPayAbleAmount === lowestAmount);
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
        const bets = await Bet.find({ contestId, number: winningNumber }).lean();
        if (bets.length) {
            return bets.map(bet => ({userId:bet.userId,amount:this.getPrizeByKind(bet.amount,bet.kind)}));//prize money to get if win according to bet kind
        }
        return [];
    }
    updateWinnerUserIdsBalance = async (winners) => {
        // const response = await User.updateMany(
        //     { _id: { $in: usersIds } },
        //     { $inc: { balance: amount } }).lean();
        // return response;
        const bulkOperations = winners.map(update => ({
            updateOne: {
              filter: { _id: update.userId },
              update: { $inc: { balance:  update.amount } },
              upsert:true
            },
          }));
      
      
          const result = await User.bulkWrite(bulkOperations);
          console.log('Winners updated successfully:', result);
          return result;
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

    getBetSummaryUserForCurrentContest = async (userId) => {
        const currentContest = await this.getCurrentContest();
        return await this.getBetSummaryByNumber(currentContest._id, userId);
    }



}

const contestManager = new ContestManager();
Object.freeze(contestManager);
export {
    contestManager
};

export const getAllContests = async (page, limit, status = null) => {
    //populate winner name maybe?
    page = typeof page === 'string' ? parseInt(page) : page;
    limit = typeof limit === 'string' ? parseInt(limit) : limit;
    status = typeof status === 'string' ? parseInt(status) : status;
    try {
        let filter = {
            ...(status && { status })
        }
        let request = Contest.find(filter);
        if (page !== -1) {
            const skip = (page - 1) * limit;
            request = request.skip(skip).limit(limit);
        }
        let data = {
            rows: await request.sort({ _id: -1 }).lean()
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