import PaymentTransaction from "../../db/models/PaymentTransaction.js";
import { sendResponse } from "../../utils/helper.js";
import { checkRazorpayOrderAndUpdate, createorder, generateSignature } from "./services.js";





export const initiatePayment = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount == 0) {
            return sendResponse(res, 400, 'Please provide amount to proceed.')
        }
        const userId = req.user?._id;
        const order = await createorder(amount, userId);
        const paymentTransaction = await PaymentTransaction({
            transactionDetails: order,
            status: 0,
            userId,
            amount
        });
        await paymentTransaction.save();
        //save order in db
        sendResponse(res, 200, 'Payment Initiated', order)
    } catch (error) {
        console.log(error);
        sendResponse(res, 500, 'Something went wrong', error);
    }
}
export const markPaymentDone = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return sendResponse(res, 400, 'Invalid Request.')
        }
        const generatedSignature = generateSignature(razorpay_order_id, razorpay_payment_id);
        if (generatedSignature !== razorpay_signature) {
            return sendResponse(res, 400, 'Invalid Request.')
        }
        const userId = req.user?._id;
        const paymentTransaction = await PaymentTransaction.findOne({ userId, 'transactionDetails.id': razorpay_order_id }).lean();
        let success = false;
        if (paymentTransaction) {
            success = await checkRazorpayOrderAndUpdate(paymentTransaction)
        }

        sendResponse(res, 200, 'Payment Captured', success)
    } catch (error) {
        console.log(error);
        sendResponse(res, 500, 'Something went wrong', error);
    }
}

//it is to be run by scheduler to check if payment updated
export const checkPaymentDone = async (req, res) => {
    try {
        const pendingaymentTransactions = await PaymentTransaction.find({
            status: 0,
            $or: [
                { fundReceived: null },
                { fundReceived: false },
            ]
            //todo add time limit also here that only check for order in past one day
        }).lean();

        for (let paymentTransaction in pendingaymentTransactions) {
            await checkRazorpayOrderAndUpdate(paymentTransaction);
        }

        sendResponse(res, 200, 'Success')
    } catch (err) {
        sendResponse(res, 500, 'Something went wrong', err)
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const paymentTransaction = await PaymentTransaction.find({
            userId
        }).lean();

        if (!paymentTransaction) {
            return sendResponse(res, 400, 'Invalid Transaction Id');
        }

        const status = await checkRazorpayOrderAndUpdate(paymentTransaction);
        sendResponse(res, 200, 'Success', status);
    } catch (err) {
        sendResponse(res, 500, 'Something went wrong', err)
    }
};