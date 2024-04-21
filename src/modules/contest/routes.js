import express from 'express'
import { endPreviousAndCreateNew, getAllPrevContests, getCurrentContest, modifyContestWinningNumber } from './controllers.js';
import { isValidAdmin } from '../middlewares/index.js';
import { placeBet } from '../bet/controller.js';
const contestRouter = express.Router();

contestRouter.get("/current", getCurrentContest);
contestRouter.get("/grid", getAllPrevContests);

contestRouter.post("/place-bet", placeBet);

contestRouter.put("/modify-bet", isValidAdmin, modifyContestWinningNumber);



//end prev contest and create new one and for this create a admin token with infinite validity and called by scheduler only
contestRouter.get("/end-previous-contest-and-create-new", isValidAdmin, endPreviousAndCreateNew);


export default contestRouter;


