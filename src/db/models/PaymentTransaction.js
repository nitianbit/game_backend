import mongoose from 'mongoose';

const PaymentTransactionSchema = new mongoose.Schema({
    /**
   * 0: Created
   * 1: Success
   * 2: Failed
   */
    status: { type: Number },
    amount: { type: Number },
    transactionDetails: { type: mongoose.Schema.Types.Mixed },
    fundReceived: { type: Boolean },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
}, {
    collection: 'PaymentTransaction'
});

const PaymentTransaction = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
export default PaymentTransaction;