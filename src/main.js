import { homedir } from 'node:os';
import { startRepl } from './repl.js';

const state = {
    currentDir: homedir()
};

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${state.currentDir}`);

startRepl(state);