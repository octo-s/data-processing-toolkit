import * as readline from 'node:readline';
import { goUp, changeDirectory, listDirectory } from './navigation.js';

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

            await handleCommand(command, args, state);

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
        switch (command) {
            case 'up':
                state.currentDir = goUp(state.currentDir);
                console.log(`You are currently in ${state.currentDir}`);
                break;

            case 'cd':
                if (args.length === 0) {
                    console.log('Invalid input');
                    return;
                }
                const result = await changeDirectory(args[0], state.currentDir);
                if (result.success) {
                    state.currentDir = result.newDir;
                    console.log(`You are currently in ${state.currentDir}`);
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
                    console.log(`You are currently in ${state.currentDir}`);
                } else {
                    console.log('Operation failed');
                }
                break;

            // TODO: add more commands

            default:
                console.log('Invalid input');
        }
    } catch (error) {
        console.log('Operation failed');
    }
}