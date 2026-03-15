function parseArgs(args) {
    const result = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--')) {
            const key = arg.slice(2);

            const nextArg = args[i + 1];

            if (nextArg === undefined || nextArg.startsWith('--')) {
                result[key] = true;
            } else {
                result[key] = nextArg;
                i++;
            }
        }
    }

    return result;
}

module.exports = { parseArgs };
