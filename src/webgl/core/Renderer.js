import Experience from 'core/Experience.js'
import { Fn, float, floor, vec4, renderOutput } from 'three/tsl'
import { NoToneMapping, RenderPipeline, WebGPURenderer } from 'three/webgpu'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js'
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

const POSTERIZE_LEVELS = 17
const PIXEL_SIZE = 2

const posterize = Fn(([color]) => {
	const levels = float(POSTERIZE_LEVELS)
	const rgb = floor(color.rgb.mul(levels)).div(levels)
	return vec4(rgb, color.a)
})

export default class Renderer {
	constructor() {
		this.experience = new Experience()
		this.canvas = this.experience.canvas
		this.sizes = this.experience.sizes
		this.scene = this.experience.scene
		this.cssScene = this.experience.cssScene
		this.camera = this.experience.camera

		this._createInstance()
		this._createCssInstance()
		this._createPipeline()
		this._createLoop()
	}

	_createInstance() {
		this.instance = new WebGPURenderer({
			canvas: this.canvas,
			powerPreference: 'high-performance',
			antialias: false,
		})
		this.instance.outputColorSpace = 'srgb'
		this.instance.setClearColor('#211d20')
		this.instance.setSize(this.sizes.width, this.sizes.height)
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

		if (this.experience.debug.active) {
			this.instance.inspector = new Inspector()
			this.experience.debug.attach(this.instance.inspector)
		}
	}

	_createCssInstance() {
		this.cssInstance = new CSS3DRenderer()
		this.cssInstance.setSize(this.sizes.width, this.sizes.height)
		this.cssInstance.domElement.style.position = 'fixed'
		this.cssInstance.domElement.style.top = 0
		this.cssInstance.domElement.style.pointerEvents = 'none'
		document.body.appendChild(this.cssInstance.domElement)
	}

	_createPipeline() {
		this._pixelationPass = pixelationPass(this.scene, this.camera.instance, PIXEL_SIZE, 0, 0)

		this._pipeline = new RenderPipeline(this.instance)
		this._pipeline.outputColorTransform = false
		this._pipeline.outputNode = renderOutput(posterize(this._pixelationPass), NoToneMapping)
	}

	_createLoop() {
		this.instance.setAnimationLoop((timestamp) => {
			this.experience.time.update(timestamp)
		})
	}

	resize() {
		this.instance.setSize(this.sizes.width, this.sizes.height)
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
		this.cssInstance.setSize(this.sizes.width, this.sizes.height)
	}

	update() {
		this._pixelationPass.camera = this.camera.instance
		this._pipeline.render()
		this.cssInstance.render(this.cssScene, this.camera.instance)
	}
}
