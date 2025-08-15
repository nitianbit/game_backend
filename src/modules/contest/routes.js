import express from 'express'
import { endPreviousAndCreateNew, getAllPrevContests, getCurrentContest, getderievedNumber, getpreviousContestWinning, modifyContestWinningNumber } from './controllers.js';
import { isValidAdmin } from '../middlewares/index.js';
import { betSummaryofUser, cancelBet, placeBet } from '../bet/controller.js';
const contestRouter = express.Router();

contestRouter.get("/current", getCurrentContest);
contestRouter.get("/grid", getAllPrevContests);
contestRouter.get("/derived", getderievedNumber);
contestRouter.get("/prev-contest-winning", getpreviousContestWinning);

contestRouter.post("/place-bet", placeBet);
contestRouter.post("/cancel-bet", cancelBet);
contestRouter.get("/bet-summary", betSummaryofUser);

contestRouter.put("/modify-bet", isValidAdmin, modifyContestWinningNumber);



//end prev contest and create new one and for this create a admin token with infinite validity and called by scheduler only
contestRouter.get("/end-previous-contest-and-create-new", isValidAdmin, endPreviousAndCreateNew);


export default contestRouter;


