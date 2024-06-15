import mongoose from "mongoose";
import { Bet } from "../../db/models/Bets.js";
import { CONTEST_STATUS, Contest } from "../../db/models/Contest.js";
import { User } from "../../db/models/User.js";
import { now } from "../../utils/helper.js";
import { BET_TYPE } from "../../utils/constants.js";
import fs from 'fs'
import { STORAGE_KEYS, storage } from "../../services/storage.js";

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

        if (storage.isKeyExists(STORAGE_KEYS.CURRENT_CONTEST)) {
            const currentContest = storage.getKey(STORAGE_KEYS.CURRENT_CONTEST);
            const contestId = currentContest?._id;
            if (id !== contestId) return null;
            const response = await this.updateContest(contestId, { winningNumber, modifiedByAdmin: true });
            return response;
        }
        return null;
    }

    startNewContest = async (hardUpdate = false) => {
        if (!storage.isKeyExists(STORAGE_KEYS.CURRENT_CONTEST) || hardUpdate) {
            const newContest = await this.createContest();
            storage.setKey(STORAGE_KEYS.CURRENT_CONTEST, newContest);
            return newContest;
        }
        return storage.get(STORAGE_KEYS.CURRENT_CONTEST);
    }

    closePreviousContest = async (contestId) => {
        //TODO fetch winner and update and all other things
        const updateObj = {
            status: CONTEST_STATUS.ENDED
        };
        const response = await this.updateContest(contestId, updateObj);
        return response;
    }

    returnValidContest = (contest) => {//check contest s bet only allowed for 55 seconds 
        const currentTime = now();
        const { startTime } = contest;
        if (currentTime <= (startTime + 55)) {//as bet only allowed for 55 seconds
            return contest;
        }
        return null
    }

    getPrizeByKind = (amount, kind) => {
        switch (kind) {
            case BET_TYPE.SINGLE_BET:
                return (amount * 9.6).toFixed(2);
            case BET_TYPE.SMALL_CAP:
                return (amount * 2.4 * 4).toFixed(2);
            case BET_TYPE.MID_CAP:
                return (amount * 4.8 * 2).toFixed(2);
            case BET_TYPE.LARGE_CAP:
                return (amount * 2.4 * 4).toFixed(2);
            default:
                return (amount * 9.6).toFixed(2);
        }
    }

    currentOnGoingContest = async (fromDb = false) => {
        if (fromDb) {
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $gte: now() - 70 }//to make su
            }).lean();
            return currentContest;
        }
        if (!storage.isKeyExists(STORAGE_KEYS.CURRENT_CONTEST)) {
            //check in db if there is current contest goingon then use that else create one
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $gte: now() - 60 }
            }).lean();
            if (currentContest) {
                //TODO check if time not over and make the creating method single to avaoid multiple instance if both this function and scheduler run at same time
                let contest = this.returnValidContest(currentContest)
                if (contest) {
                    storage.setKey(STORAGE_KEYS.CURRENT_CONTEST, contest)
                    return contest;
                }
                return null
            }
            return await this.startNewContest();
        }
        return this.returnValidContest(storage.getKey(STORAGE_KEYS.CURRENT_CONTEST));
    }

    performAggregation = async (matchCondition) => {
        const betSummary = await Bet.aggregate([
            {
                $match: matchCondition
            },
            {
                $addFields: {
                    prizeMultiplier: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$kind", BET_TYPE.SINGLE_BET] }, then: 9.6 },
                                { case: { $eq: ["$kind", BET_TYPE.SMALL_CAP] }, then: 2.4 * 4 },
                                { case: { $eq: ["$kind", BET_TYPE.MID_CAP] }, then: 4.8 * 2 },
                                { case: { $eq: ["$kind", BET_TYPE.LARGE_CAP] }, then: 2.4 * 4 }
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
                    ...(matchCondition?.userId && { betIds: { $push: '$_id' } })
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
        for (let i = 0; i <= 9; i++) {
            betSummaryMap.set(i, { totalCount: 0, totalAmount: 0, totalPayAbleAmount: 0 });
        }

        betSummary.forEach((entry) => {
            const { _id, totalCount, totalAmount, totalBetAmount } = entry;
            betSummaryMap.set(_id, { totalCount, totalAmount, betIds: entry?.betIds ?? [], totalPayAbleAmount: totalBetAmount, kinds: entry?.kinds ?? [] });
        });

        return Object.fromEntries(betSummaryMap);
    }

    //in map format and each number contain total bet and total amount
    getBetSummaryByNumber = async ({ contestId = "", userId = "", fromCache = true }) => {
        if (!contestId) return null;

        //if previously stored return from bet_summary
        const key = userId ? `${STORAGE_KEYS.BET_SUMMARY}_${contestId}_${userId}` : `${STORAGE_KEYS.BET_SUMMARY}_${contestId}`;

        //checking if storing in userId or overall (for user we will store it like BET_SUMMARY_CONTEST_USERID)
        if (fromCache && storage.getKey(key)) {
            return storage.getKey(key);
        }
        if (userId) {
            const matchedCondition = {
                contestId: new mongoose.Types.ObjectId(contestId),
                ...(userId && { userId: new mongoose.Types.ObjectId(userId) })
            }
            const userBetSummary = await this.performAggregation(matchedCondition);//aggregate for user speific summary
            //store in node-cache also  
            storage.setKey(`${STORAGE_KEYS.BET_SUMMARY}_${contestId}_${userId}`, userBetSummary);//set user key
        }

        const contestCondition = {
            contestId: new mongoose.Types.ObjectId(contestId)
        }
        const betSummary = await this.performAggregation(contestCondition);//aggregate for contest
        //store overall summary
        storage.setKey(`${STORAGE_KEYS.BET_SUMMARY}_${contestId}`, betSummary);
        //store winning data {winningNumber & winningAmount} also
        const derievedData = this.getDerievedNumber(betSummary)
        const derivedKey = `${STORAGE_KEYS.DERIEVED}_${contestId}`;
        // if(!storage.isKeyExists(derivedKey)){
        storage.setKey(derivedKey, derievedData);
        // }
        return betSummary;

    }

    getDerievedNumber = (bets) => {//betSummary
        if (!bets) {
            return { winningNumber: null, winningAmount: null }
        }
        let lowestAmount = Infinity;
        const betsArray = [];

        //fetch the lowest amount
        Object.entries(bets).forEach(([betNumber, bet]) => {
            const { totalCount, totalAmount, totalPayAbleAmount } = bet;
            if (totalPayAbleAmount <= lowestAmount) {
                lowestAmount = totalPayAbleAmount;
            }
            betsArray.push({ number: betNumber, totalCount, totalAmount, totalPayAbleAmount });
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

    calculateWinningNumber = async (contestId) => {
        if (!contestId) {
            return { winningNumber: null, winningAmount: null }
        }
        const derievedCache = storage.getKey(`${STORAGE_KEYS.DERIEVED}_${contestId}`)
        if (derievedCache) {
            return derievedCache;
        }
        const bets = await this.getBetSummaryByNumber({ contestId });
        const derievedData = this.getDerievedNumber(bets)
        const derivedKey = `${STORAGE_KEYS.DERIEVED}_${contestId}`;
        if (!storage.isKeyExists(derivedKey)) {
            storage.setKey(`${STORAGE_KEYS.DERIEVED}_${contestId}`, derievedData);
        }
        return derievedData;

    }

    fetchWinnerUserIds = async (contestId, winningNumber) => {
        const bets = await Bet.find({ contestId, number: winningNumber }).lean();
        if (bets.length) {
            return bets.map(bet => ({ userId: bet.userId, amount: this.getPrizeByKind(bet.amount, bet.kind) }));//prize money to get if win according to bet kind
        }
        return [];
    }
    updateWinnerUserIdsBalance = async (winners) => {
        const bulkOperations = winners.map(update => ({
            updateOne: {
                filter: { _id: update.userId },
                update: { $inc: { balance: update.amount } },
                upsert: true
            },
        }));


        const result = await User.bulkWrite(bulkOperations);
        return result;
    }

    getCurrentContest = async () => {
        if (!storage.isKeyExists(STORAGE_KEYS.CURRENT_CONTEST)) {
            const currentContest = await Contest.findOne({
                status: CONTEST_STATUS.RUNNING,
                startTime: { $lte: now() },
            }).lean();

            if (currentContest) {
                storage.setKey(STORAGE_KEYS.CURRENT_CONTEST, currentContest);
                return currentContest;
            }
            return null;
        }
        return storage.getKey(STORAGE_KEYS.CURRENT_CONTEST);
    }

    getBetSummaryUserForCurrentContest = async ({ userId, fromCache = true }) => {
        const currentContest = await this.getCurrentContest();
        return await this.getBetSummaryByNumber({ contestId: currentContest._id, userId, fromCache });
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
