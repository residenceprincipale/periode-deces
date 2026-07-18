import fs from 'node:fs'
import { networkInterfaces } from 'os'
import * as dotenv from 'dotenv'

dotenv.config()

const devServerIp = getDevServerIp()
ensureEnvFile()
writeEnvVariable('DEV_SERVER_IP', devServerIp)
writeEnvVariable('DEBUGGER_SERVER_PORT', randomIntFromRange(3001, 7999).toString())

function getDevServerIp() {
	const networks = networkInterfaces()
	if (typeof networks.en0 === 'undefined') return 'localhost'
	const address = networks.en0.find((item) => item.family === 'IPv4')?.address
	return address ?? 'localhost'
}

function ensureEnvFile() {
	if (!fs.existsSync('./.env')) {
		fs.writeFileSync('./.env', '', 'utf-8')
	}
}

function writeEnvVariable(key, value) {
	const envFileContent = fs.readFileSync('./.env', 'utf8')
	const envFileLines = envFileContent.split('\n')
	let found = false

	for (let i = 0; i < envFileLines.length; i++) {
		if (envFileLines[i].includes(key)) {
			console.log(`\n🫡  Updating ${key} env variable to ${value} 🫡\n`)
			envFileLines[i] = `${key}=${value}`
			found = true
		}
	}

	if (!found) {
		console.log(`\n🫡  Creating ${key} env variable 🫡\n`)
		envFileLines.push(`${key}=${value}`)
	}

	fs.writeFileSync('./.env', envFileLines.join('\n'), 'utf-8')
}

function randomIntFromRange(min, max) {
	return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min))
}
