import express from 'express'
import { endPreviousAndCreateNew, getCurrentContest } from './controllers.js';
import { isValidAdmin } from '../middlewares/index.js';
const contestRouter = express.Router();

contestRouter.get("/current", getCurrentContest);

contestRouter.get("/modify-bet", isValidAdmin, getCurrentContest);
//end prev contest and create new one and for this create a admin token with infinite validity and called by scheduler only
contestRouter.get("/end-previous-contest-and-create-new", isValidAdmin, endPreviousAndCreateNew);


export default contestRouter;


