import { Bet } from "../../db/models/Bets.js";

export const createBet = async (betData) => {
    const bet = new Bet(betData);
    await bet.save();
};
