import { defineConfig, loadEnv } from 'vite'
import glslify from 'vite-plugin-glslify'
import path from 'path'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, path.resolve(__dirname), '')

	return {
		root: 'src',
		publicDir: '../public',
		build: {
			outDir: '../dist',
		},
		define: {
			'import.meta.env.DEV_SERVER_IP': JSON.stringify(env.DEV_SERVER_IP ?? 'localhost'),
			'import.meta.env.DEBUGGER_SERVER_PORT': JSON.stringify(env.DEBUGGER_SERVER_PORT ?? '3999'),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
				webgl: path.resolve(__dirname, 'src/webgl'),
				utils: path.resolve(__dirname, 'src/webgl/utils'),
				scenes: path.resolve(__dirname, 'src/webgl/scenes'),
				components: path.resolve(__dirname, 'src/webgl/components'),
				core: path.resolve(__dirname, 'src/webgl/core'),
			},
		},
		plugins: [...glslify()],
	}
})
