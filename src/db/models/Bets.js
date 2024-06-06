import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true
    },
    number: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    kind:{
        type:Number ,//1-single bet(9.6),2-small-cap(2.4),3-mid-cap(4.8),4-large-cap(2.4)
        default:1
    }
}, {
    collection: 'Bets',
});

export const Bet = mongoose.model('Bets', betSchema);
