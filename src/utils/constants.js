
export const BET_TYPE = {
    SINGLE_BET: 1,
    SMALL_CAP: 2,
    MID_CAP: 3,
    LARGE_CAP: 4
}

export const CronExpression = {
    EVERY_SECOND: "* * * * * *",
    EVERY_2_SECONDS: "*/2 * * * * *",
    EVERY_5_SECONDS: "*/5 * * * * *",
    EVERY_10_SECONDS: "*/10 * * * * *",
    EVERY_30_SECONDS: "*/30 * * * * *",
    EVERY_MINUTE: "*/1 * * * *",

}


export const SOCKET_EVENTS = {
    GAME_START: 'GAME_START',
    GAME_END: 'GAME_END',
    WINNING_NUMBER:'WINNING_NUMBER'
}