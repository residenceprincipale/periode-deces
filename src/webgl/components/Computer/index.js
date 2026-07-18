import addObjectDebug from '@/webgl/utils/addObjectDebug'
import Component from 'core/Component.js'
import Experience from 'core/Experience.js'
import { gsap } from 'gsap'
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene, Vector3 } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import Graph from './activities/Graph'

export default class Computer extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.camera = this.experience.camera // Get the camera for projection
		this.resources = this.scene.resources
		this.sizes = this.experience.sizes

		this.css3dRenderer = this.experience.renderer.cssInstance
		this.css3dScene = this.experience.cssScene

		this.screenPoint = this.setScreenPoint()
		this.screenElement = this.setScreenElement()
		this.screenBounds = this.setScreenBounds()

		this._createMaterial()
		this._createMesh()
		this._createDebug()

		this.tempPosition = new Vector3()

		this._graphActivity = new Graph()

		this._graphActivity.on('end', () => {
			this._graphActivity.hide()
			this._graphActivity.reset()
			this.trigger('task:complete', [this._graphActivity.score])
			this.isPlaying = false
			this.isShowed = false
		})

		this.sizes.on('resize', this.resize.bind(this))

		this._createListeners()
	}

	_createListeners() {
		this.experience.interactionManager.addInteractiveObject(this.mesh)
		this.mesh.addEventListener('click', this._handleMouseClick)
		this.mesh.addEventListener('mouseenter', this._handleMouseEnter)
		this.mesh.addEventListener('mouseleave', this._handleMouseLeave)

		addEventListener('keydown', this._handleKeyDown)
		addEventListener('keyup', this._handleKeyUp)
	}

	_handleKeyDown = (event) => {
		if (event.repeat) return

		const key = this.keysMap.get(event.code)
		if (key) {
			key.position.y = -0.01
		}
	}

	_handleKeyUp = (event) => {
		const key = this.keysMap.get(event.code)
		if (key) {
			key.position.y = 0
		}
	}

	_handleMouseClick = () => {
		if (this.isShowed) {
			this.playTask()
		}
	}

	_handleMouseEnter = () => {
		if (this.isShowed && !this.isPlaying) document.documentElement.style.cursor = 'pointer'
	}

	_handleMouseLeave = () => {
		document.documentElement.style.cursor = ''
	}

	showTask() {
		//TODO: Show random task
		this.isShowed = true
		this._graphActivity.showTask()
	}

	playTask(side) {
		this.isShowed = false
		this.isPlaying = true
		this._graphActivity.playTask(side)
	}

	_createMaterial() {
		// this.material = new ShaderMaterial({
		// 	fragmentShader,
		// 	vertexShader,
		// 	uniforms: {
		// 		uOpacity: { value: 1 },
		// 	},
		// })

		const texture = this.resources.items.bakeTexture
		texture.channel = 1

		this.material = new MeshBasicMaterial({
			map: texture,
		})
	}

	_createMesh() {
		this.mesh = this.resources.items.computerModel.scene.clone()

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
			if (child.name === 'keys') {
				this.keysMap = new Map(child.children.map((key) => [key.name, key]))
			}
		})
		this.add(this.mesh)

		return this.mesh
	}

	setScreenElement() {
		const screen = document.querySelector('.computer-screen')

		//handle mouse events
		screen.addEventListener('mouseenter', this._handleMouseEnter)
		screen.addEventListener('mouseleave', this._handleMouseLeave)
		screen.addEventListener('click', this._handleMouseClick)

		const cssObject = new CSS3DObject(screen)

		// Position it on the cube (modify this based on your cube's dimensions and face positioning)
		cssObject.position.copy(this.screenPoint.position) // Example, adjust to position on the correct face
		cssObject.rotation.copy(this.screenPoint.rotation) // Example, adjust to position on the correct face
		cssObject.scale.set(0.0105, 0.0105, 0.0105) // Adjust the rotation as needed

		this.css3dScene.add(cssObject)

		return cssObject
	}

	setScreenBounds() {
		const screenBounds = {}

		screenBounds.left = this.screenPoint.position.x
		screenBounds.right = this.screenPoint.position.x
		screenBounds.top = this.screenPoint.position.y
		screenBounds.bottom = this.screenPoint.position.y

		return screenBounds
	}

	setScreenPoint() {
		const screenPoint = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial({ color: 0xff0000 }))
		screenPoint.position.set(0.06, 2.17, -0.47)
		// screenPoint.rotation.y = Math.PI;

		this.scene.add(screenPoint)

		return screenPoint
	}

	update() {
		this._graphActivity.update()
	}

	_createDebug() {
		if (this.debug.active) {
			addObjectDebug(this.debug.ui, this.screenPoint, { title: 'Cube' })
		}
	}

	resize() {
		this.css3dRenderer.setSize(this.experience.sizes.width, this.experience.sizes.height)
		this._graphActivity.resize()
	}
}
