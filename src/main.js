const os = require('os');
const { startRepl } = require('./repl');

const state = {
    currentDir: os.homedir()
};

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${state.currentDir}`);

startRepl(state);