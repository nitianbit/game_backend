import { Bet } from '../models/Bet';

export const placeBet = async (betData) => {
    const bet = new Bet(betData);
    await bet.save();
};
