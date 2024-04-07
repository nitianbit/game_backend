import mongoose from "mongoose";

const schema = new mongoose.Schema({
    status: Number, //0- created, 1- running, 2-ended
    winner: { type: mongoose.Types.ObjectId, ref: 'User' },
    winningNumber: { type: Number },
    winningAmount: { type: Number },
    modifiedByAdmin: {
        type: Boolean,
        default: false
    },
    startTime: { type: Number }
}, {
    collection: 'Contest',
});

export const Contest = mongoose.model('Contest', schema);


export const CONTEST_STATUS = {
    CREATED: 0,
    RUNNING: 1,
    ENDED: 2
}
