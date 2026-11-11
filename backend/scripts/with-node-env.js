import { spawn } from 'node:child_process'

const [nodeEnv, command, ...args] = process.argv.slice(2)

if (!nodeEnv || !command) {
    throw new Error('Usage: with-node-env.js <NODE_ENV> <command> [args...]')
}

const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: nodeEnv },
})

child.on('error', (error) => {
    console.error(`Failed to start ${command}:`, error)
    process.exitCode = 1
})

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal)
        return
    }
    process.exitCode = code ?? 1
})
