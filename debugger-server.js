import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'node:fs'
import util from 'util'
import { exec } from 'child_process'
import * as dotenv from 'dotenv'

dotenv.config()

const debuggerIp = process.env.DEV_SERVER_IP ?? 'localhost'
const PORT = process.env.DEBUGGER_SERVER_PORT ?? '3999'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: '500mb' }))
app.use(cors({ origin: '*' }))

app.listen(PORT, () => {
	console.log(`\n🟢 Debugger server running on http://${debuggerIp}:${PORT}\n`)
})

app.post('/save', (req, res) => {
	const { data, file } = req.body

	fs.writeFileSync(file, 'export default ' + util.inspect(data, false, 7, false) + ';', 'utf-8')
	exec(`npx eslint --fix ${file}`)

	res.sendStatus(200)
})

app.get('/check', (_req, res) => {
	res.send('check')
})
