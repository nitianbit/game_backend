import { contestManager } from "./modules/contest/services.js"

const testWinners=async()=>{
    try {
        const winners=[
            { userId:"66226dc28876b5be93e5362c",amount:2},
            { userId:"6624a2d12be3583cb0370d28",amount:4},
        ]
        contestManager.updateWinnerUserIdsBalance(winners)
    } catch (error) {
        console.log(error)
    }
}   

const testSummary=async()=>{
    try {
        const contestId="666727747bc1f07041bd18e4"
        const bets = await contestManager.getBetSummaryByNumber({contestId});
        console.log(bets)

        contestManager.calculateWinningNumber(contestId)
        .then(async ({ winningNumber, winningAmount }) => {
            // await contestManager.updateContest(prevOnGoingContest._id, { winningNumber, winningAmount });
            //TODO add some balance to the user accounts (needs to discuss what amount to be credited to user's wallet)
            const winners = await contestManager.fetchWinnerUserIds(contestId, 0);
            if (winners.length > 0) {
                await contestManager.updateWinnerUserIdsBalance(winners);
            }
        })
    } catch (error) {
        
    }
}


export const test=async()=>{
    // testSummary()
}