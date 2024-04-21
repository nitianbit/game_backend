import mongoose from "mongoose";
import { sendResponse } from "../../utils/helper.js";
import { contestManager, getAllContests } from "./services.js";


export const getCurrentContest = async (req, res) => {
    try {
        const currentOnGoingContest = await contestManager.currentOnGoingContest();
        const betSummary = await contestManager?.getBetSummaryByNumber(currentOnGoingContest?._id);
        const contestStatus = {
            contest: currentOnGoingContest,
            betSummary
        };
        return sendResponse(res, 200, "Success", contestStatus)
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}


export const modifyContestWinningNumber = async (req, res) => {
    try {
        const { contestId, winningNumber } = req.body;
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
        const prevOnGoingContest = await contestManager.currentOnGoingContest();
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
            contestManager.calculateWinningNumber(prevOnGoingContest._id)
                .then(async ({ winningNumber, winningAmount }) => {
                    await contestManager.updateContest(prevOnGoingContest._id, { winningNumber, winningAmount });
                    //TODO add some balance to the user accounts (needs to discuss what amount to be credited to user's wallet)
                    const winnerUserIds = await contestManager.fetchWinnerUserIds(prevOnGoingContest._id, winningNumber);
                    if (winnerUserIds.length > 0) {
                        await contestManager.updateWinnerUserIdsBalance(winnerUserIds, winningAmount);
                    }
                })
        }
        return sendResponse(res, 200, "Success")
    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, "Internal server error", error)
    }
}

export const getAllPrevContests = async (req, res) => {
    try {
        const { page = 1, records = 20 } = req.query;
        const contests = await getAllContests(page, records);
        sendResponse(res, 200, "Success", contests)
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, "Internal server error", error)
    }
}

