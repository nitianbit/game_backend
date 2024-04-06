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
    }
}, {
    collection: 'Bets',
});

export const Bet = mongoose.model('Bets', betSchema);
