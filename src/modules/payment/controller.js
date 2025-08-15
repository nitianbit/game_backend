import PaymentTransaction from "../../db/models/PaymentTransaction.js";
import { sendResponse } from "../../utils/helper.js";
import { checkRazorpayOrderAndUpdate, createorder, generateSignature } from "./services.js";
import { CONFIG } from "../../config/config.js";
import { User } from "../../db/models/User.js";
import mongoose from 'mongoose';


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
        sendResponse(res, 200, 'Payment Initiated', { ...order, key: CONFIG.RAZORPAY_KEY })
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




export const transferPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { secondUser, funds } = req.body;

    // Validate input
    if (!secondUser || !funds || funds <= 0) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 400, "Invalid input");
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'User not found');
    }

    if (user.balance < funds) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 400, "Insufficient balance");
    }

    const user2 = await User.findOne({ phone: secondUser }).session(session);
    if (!user2) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'Receiving user not found');
    }

    // Update balances atomically
    user.balance -= funds;
    user2.balance += funds;

    await user.save({ session });
    console.log("Balance deducted from sender");

    await user2.save({ session });
    console.log("Balance added to receiver");

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 200, 'Success', "Balance transferred");
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return sendResponse(res, 500, 'Something went wrong', err.message || err);
  }
};



export const addMoney = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { userPhone, funds } = req.body;

    const admin = await User.findById(userId).session(session);
    if (!admin) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'Admin not found');
    }

    if (!admin.userType) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 403, "You don't have admin privileges");
    }

    const user = await User.findOne({ phone: userPhone }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'User not found');
    }

    user.balance += funds;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 200, 'Success', 'Balance Added');
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return sendResponse(res, 500, 'Something went wrong', err.message || err);
  }
};



export const DeductMoney = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { userPhone, funds } = req.body;

    const admin = await User.findById(userId).session(session);
    if (!admin) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'Admin not found');
    }

    if (!admin.userType) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 403, "You don't have admin privileges");
    }

    const user = await User.findOne({ phone: userPhone }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, 'User not found');
    }

    if (user.balance < funds) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 400, "Insufficient balance");
    }

    user.balance -= funds;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 200, 'Success', 'Balance Deducted');
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return sendResponse(res, 500, 'Something went wrong', err.message || err);
  }
};

