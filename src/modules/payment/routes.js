import express from 'express'
import { checkPaymentDone, checkPaymentStatus, initiatePayment, markPaymentDone } from './controller.js';
const paymentRouter = express.Router();

paymentRouter.post('/initiate', initiatePayment);
paymentRouter.get('/status', checkPaymentStatus);
paymentRouter.post('/mark-capture', markPaymentDone);
//TODO add scheduler
paymentRouter.post('/payment-scheduler', checkPaymentDone);

export default paymentRouter;


