import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const settingsRoot = path.resolve(projectRoot, 'src/webgl')

function debugSavePlugin() {
	return {
		name: 'debug-save',
		configureServer(server) {
			server.middlewares.use('/debug/save', (req, res, next) => {
				if (req.method !== 'POST') return next()

				const chunks = []
				req.on('data', (chunk) => chunks.push(chunk))
				req.on('end', () => {
					try {
						const { data, file } = JSON.parse(Buffer.concat(chunks).toString())
						const filePath = path.resolve(projectRoot, file)

						if (!filePath.startsWith(settingsRoot) || !filePath.endsWith('settings.js')) {
							res.statusCode = 403
							res.end('forbidden')
							return
						}

						fs.writeFileSync(filePath, 'export default ' + util.inspect(data, false, 7, false) + ';\n')
						res.statusCode = 200
						res.end('ok')
					} catch (error) {
						res.statusCode = 400
						res.end(String(error))
					}
				})
			})
		},
	}
}

export default defineConfig({
	root: 'src',
	publicDir: '../public',
	build: {
		outDir: '../dist',
	},
	resolve: {
		alias: [
			{ find: /^three$/, replacement: 'three/webgpu' },
			{ find: '@', replacement: path.resolve(projectRoot, 'src') },
			{ find: 'webgl', replacement: path.resolve(projectRoot, 'src/webgl') },
			{ find: 'utils', replacement: path.resolve(projectRoot, 'src/webgl/utils') },
			{ find: 'scenes', replacement: path.resolve(projectRoot, 'src/webgl/scenes') },
			{ find: 'components', replacement: path.resolve(projectRoot, 'src/webgl/components') },
			{ find: 'core', replacement: path.resolve(projectRoot, 'src/webgl/core') },
		],
	},
	plugins: [debugSavePlugin()],
})
