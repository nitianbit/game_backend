import mongoose from "mongoose";

const schema = new mongoose.Schema({
    status: { type: Number }, //0- initiated, 1- completed,2-cancelled
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    user: { type: String }, //storing user name so that we don't have to populate user details in grid api
    initiatedAt: { type: Number },
    completedAt: { type: Number },
    amount: { type: Number },
    amountTransferred: { type: Number }

}, {
    collection: 'Payout',
});

export const Payout = mongoose.model('Payout', schema);


export const PAYOUT_STATUS = {
    CREATED: 0,
    SUCCESS: 1,
}
