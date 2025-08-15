
export const sendResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        message: message,
        data: data
    });
}


export const now = () => Math.floor(Date.now() / 1000)

export const obfuscateNumber = (number) => {
    const factor = 7;  // Choose a constant factor
    const offset = 1234;  // Choose a constant offset
    return (number * factor) + offset;
};


export const deobfuscateNumber = (obfuscatedNumber) => {
    const factor = 7;  // Same constant factor used for obfuscation
    const offset = 1234;  // Same constant offset used for obfuscation
    return (obfuscatedNumber - offset) / factor;
};