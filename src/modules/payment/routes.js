import express from 'express'
import { checkPaymentDone, checkPaymentStatus, initiatePayment, markPaymentDone, transferPayment,DeductMoney,addMoney} from './controller.js';
const paymentRouter = express.Router();

paymentRouter.post('/initiate', initiatePayment);
paymentRouter.get('/status', checkPaymentStatus);
paymentRouter.post('/mark-capture', markPaymentDone);
paymentRouter.post('paymentTransfer',transferPayment);
paymentRouter.post('deductMoney',DeductMoney);
paymentRouter.post('addMoney',addMoney);
//TODO add scheduler
paymentRouter.post('/payment-scheduler', checkPaymentDone);

export default paymentRouter;


