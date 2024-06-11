import mongoose from "mongoose";
import { obfuscateNumber, sendResponse } from "../../utils/helper.js";
import { contestManager, getAllContests } from "./services.js";
import { CONTEST_STATUS, Contest } from "../../db/models/Contest.js";
import { Bet } from "../../db/models/Bets.js";


export const getCurrentContest = async (req, res) => {
    try {
        const currentOnGoingContest = await contestManager.currentOnGoingContest();
        const betSummary = await contestManager?.getBetSummaryByNumber({contestId:currentOnGoingContest?._id});
        console.log("getCurrentContest calculating winning number",currentOnGoingContest?._id?.toString())
        const {winningNumber}=await contestManager.calculateWinningNumber(currentOnGoingContest?._id);
        console.log(winningNumber)
        const contestStatus = {
            contest: currentOnGoingContest,
            betSummary,
            derieved:obfuscateNumber(winningNumber)
        };
        return sendResponse(res, 200, "Success", contestStatus)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}

export const getderievedNumber = async (req, res) => {
    try {
        const { contest_id } = req.query;
        const {winningNumber}=await contestManager.calculateWinningNumber(contest_id);

        const contestStatus = {
            derieved:obfuscateNumber(winningNumber)
        };
        return sendResponse(res, 200, "Success", contestStatus)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}

export const getpreviousContestWinning = async (req, res) => {
    try {
       const userId=req.user?._id;
       const previousContest=await Contest.find({status:CONTEST_STATUS.ENDED}).sort({_id:-1}).limit(1).lean()
       if(!previousContest){
        return sendResponse(res, 200, "Success", {
            value:0
        })
       }
       const {winningNumber}=await contestManager.calculateWinningNumber(previousContest?._id)
        const bets = await Bet.find({ contestId:previousContest?._id, number: winningNumber,userId }).lean();
       const total=0;
       if (bets.length) {
           return bets.map(bet => {total+=contestManager.getPrizeByKind(bet.amount,bet.kind)});//prize money to get if win according to bet kind
       }
       return sendResponse(res, 200, "Success", {
        value:total
    })

        const contestStatus = {
            derieved:obfuscateNumber(winningNumber)
        };
        return sendResponse(res, 200, "Success", contestStatus)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}


export const modifyContestWinningNumber = async (req, res) => {
    try {
        const { winningNumber } = req.body;
        const currentContest = await contestManager.getCurrentContest()
        const contestId = currentContest?._id

        if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
            return sendResponse(res, 400, "Invalid request")
        }
        const response = await contestManager.updateContestWinningNumber(contestId, winningNumber);
        return sendResponse(res, 200, "Success", response)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}


export const endPreviousAndCreateNew = async (req, res) => {
    try {
        //first store the cuurent contest into a variable and start a new one
        const prevOnGoingContest = await contestManager.currentOnGoingContest(true);
        //close the current contest
        if (prevOnGoingContest) {
            await contestManager.closePreviousContest(prevOnGoingContest._id);
        }
        //create a new contest
        const currentOnGoingContest = await contestManager.startNewContest(true);

        //update prev contest winners here and update winning number if not updated by admin
        //doing it in then/catch to send resposne to schduler
        if (prevOnGoingContest) {
            //get the winning number
            console.log("endPreviousAndCreateNew calculating winning number",prevOnGoingContest?._id)
            contestManager.calculateWinningNumber(prevOnGoingContest._id)
                .then(async ({ winningNumber, winningAmount }) => {
                    await contestManager.updateContest(prevOnGoingContest._id, { winningNumber, winningAmount });
                    //TODO add some balance to the user accounts (needs to discuss what amount to be credited to user's wallet)
                    const winners = await contestManager.fetchWinnerUserIds(prevOnGoingContest._id, winningNumber);
                    if (winners.length > 0) {
                        await contestManager.updateWinnerUserIdsBalance(winners);
                    }
                })
        }
        if(res){
            return sendResponse(res, 200, "Success")
        }
    } catch (error) {
        console.log(error);
        if(res)
        return sendResponse(res, 500, "Internal server error", error)
    }
}

export const getAllPrevContests = async (req, res) => {
    try {
        const { page = 1, records = 20, status = null } = req.query;
        const contests = await getAllContests(page, records, status);
        sendResponse(res, 200, "Success", contests)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

