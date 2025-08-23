import Razorpay from "razorpay";
import { CONFIG } from "../../config/config.js";
import PaymentTransaction from "../../db/models/PaymentTransaction.js";
import crypto from 'crypto';
import { User } from "../../db/models/User.js";

export const generateSignature = (order_id, razorpay_payment_id) => {
    const hmac = crypto.createHmac('sha256', CONFIG.RAZORPAY_SECRET);
    hmac.update(order_id + "|" + razorpay_payment_id);
    return hmac.digest('hex');
}


const getInstance = () => {
    if (CONFIG.RAZORPAY_KEY && CONFIG.RAZORPAY_SECRET) {
        return new Razorpay({ key_id: CONFIG.RAZORPAY_KEY, key_secret: CONFIG.RAZORPAY_SECRET })
    }
    return null;
}

export const getPaymentReceivedByRazorpay = async (order_id) => {
    const instance = getInstance();
    if (order_id && instance) {
        const orderDetails = await instance.orders.fetch(order_id);
        if (orderDetails && orderDetails.status === 'paid') {
            return true;
        }
    }
    return false;
}

export const checkRazorpayOrderAndUpdate = async (paymentTransaction) => {
    if (paymentTransaction != null && paymentTransaction.transactionDetails != null && paymentTransaction.transactionDetails["id"]) {
        const isPaid = await getPaymentReceivedByRazorpay(paymentTransaction.transactionDetails["id"]);
        const isAlreadyProcessed=await PaymentTransaction.findById(paymentTransaction._id).lean();
        if (isPaid && isAlreadyProcessed?.status!==1) {
            await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, { fundReceived: true, status: 1 });
            await User.findByIdAndUpdate(paymentTransaction.userId, { $inc: { balance: paymentTransaction.amount } })
            //TODO add payment in user's account
        }
        return isPaid;
    }
    return false;
}

export const createorder = async (amount, userId) => {//amount in paise
    let instance = getInstance();
    const response = await instance.orders.create({
        "amount": amount * 100,
        "currency": "INR",
        "receipt": `receipt${userId}`,
        "notes": {
            "paymentBy": userId,
        }
    })
    return response;

}