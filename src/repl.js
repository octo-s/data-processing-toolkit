import * as readline from 'node:readline';
import { goUp, changeDirectory, listDirectory } from './navigation.js';
import {csvToJson} from "./commands/csvToJson.js";
import {jsonToCsv} from "./commands/jsonToCsv.js";
import { parseArgs } from './utils/argParser.js';
import {count} from "./commands/count.js";
import {hash} from "./commands/hash.js";
import {hashCompare} from "./commands/hashCompare.js";

const COMMANDS_WITH_FLAGS = ['csv-to-json', 'json-to-csv', 'count', 'hash', 'hash-compare'];

export function startRepl(state) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function prompt() {
        rl.question('> ', async (input) => {
            const trimmedInput = input.trim();

            if (trimmedInput === '.exit') {
                console.log('Thank you for using Data Processing CLI!');
                rl.close();
                process.exit(0);
            }

            if (trimmedInput === '') {
                prompt();
                return;
            }

            const parts = trimmedInput.split(/\s+/);
            const command = parts[0];
            const args = parts.slice(1);
            const parsedArgs = COMMANDS_WITH_FLAGS.includes(command) ? parseArgs(args) : args;

            await handleCommand(command, parsedArgs, state);

            prompt();
        });
    }

    rl.on('close', () => {
        console.log('\nThank you for using Data Processing CLI!');
        process.exit(0);
    });

    prompt();
}

async function handleCommand(command, args, state) {
    try {
        let handled = true;

        switch (command) {
            case 'up':
                state.currentDir = goUp(state.currentDir);
                break;

            case 'cd':
                if (args.length === 0) {
                    console.log('Invalid input');
                    return;
                }
                const result = await changeDirectory(args[0], state.currentDir);
                if (result.success) {
                    state.currentDir = result.newDir;
                } else {
                    console.log('Operation failed');
                }
                break;

            case 'ls':
                const lsResult = await listDirectory(state.currentDir);
                if (lsResult.success) {
                    for (const item of lsResult.items) {
                        const typeStr = item.type === 'folder' ? '[folder]' : '[file]';
                        console.log(`${item.name}\t${typeStr}`);
                    }
                } else {
                    console.log('Operation failed');
                }
                break;

            case 'csv-to-json':
                if (!args.input || !args.output) {
                    console.log('Invalid input');
                    return;
                }
                await csvToJson(args, state.currentDir);
                break;

            case 'json-to-csv':
                if (!args.input || !args.output) {
                    console.log('Invalid input');
                    return;
                }
                await jsonToCsv(args, state.currentDir);
                break;

            case 'count':
                if (!args.input) {
                    console.log('Invalid input');
                    return;
                }
                await count(args, state.currentDir);
                break;

            case 'hash':
                if (!args.input) {
                    console.log('Invalid input');
                    return;
                }
                await hash(args, state.currentDir);
                break;

            case 'hash-compare':
                if (!args.input || !args.hash) {
                    console.log('Invalid input');
                    return;
                }
                await hashCompare(args, state.currentDir);
                break;

            default:
                console.log('Invalid input');
                handled = false;
        }

        if (handled) {
            console.log(`You are currently in ${state.currentDir}`);
        }
    } catch (error) {
        console.log('Operation failed');
    }
}