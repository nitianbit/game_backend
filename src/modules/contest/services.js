import { CONTEST_STATUS, Contest } from "../../db/models/Contest.js";
import { now } from "../../utils/helper.js";


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
        return newContest;
    }

    //db method
    endAndUpdateContest = async (contestId, updatedData) => {
        const response = await Contest.findByIdAndUpdate(contestId, updatedData);
        return response;
    }

    startContest = async () => {
        if (!this.data.currentContest) {
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
        const response = await endAndUpdateContest(contestId, updateObj)
    }

    currentOnGoingContest = () => this.data.currentContest;

}

const contestManager = new ContestManager();
Object.freeze(contestManager);
export {
    contestManager
}; 