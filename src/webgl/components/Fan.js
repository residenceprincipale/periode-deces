import Experience from 'core/Experience.js'
import { MathUtils, MeshBasicMaterial } from 'three/webgpu'
import Component from '../core/Component'
import { gsap } from 'gsap'

const SETTINGS = {
	TURNS: 4,
}

export default class Fan extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()

		this._helixDirection = 0
		this._targetRotation = 0
		this.score = 2
		this._createListeners()
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		// texture.flipY = false
		// texture.channels = 1
		this._material = new MeshBasicMaterial({ map: texture })
		this._witnessMaterial = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this._mesh = this.scene.resources.items.fanModel.scene.children[0].clone()
		this._mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				// child.material.depthTest = false
				if (child.name === 'HELICES') {
					this.helix = child
				}
				if (child.name === 'BOUTON') {
					this.witness = child
					child.material = this._witnessMaterial
					// child.material.depthTest = false
				}
			}
		})
		this._mesh.name = 'fan'

		this.add(this._mesh)
	}

	_handleHelixMouseEnter = () => {
		if (!this.isPlaying) return
		this.experience.canvas.style.cursor = 'grab'
	}

	_handleHelixMouseLeave = () => {
		this.experience.canvas.style.cursor = ''
	}

	_handleHelixMouseDown = () => {
		if (!this.isPlaying) return
		this.experience.canvas.style.cursor = 'grabbing'
	}

	_handleHelixDrag = (event) => {
		if (!this.isPlaying) return
		const deltaX = event.mouseEvent.movementX
		const deltaY = event.mouseEvent.movementY
		const angleDelta = Math.abs(deltaX) * 0.015 + Math.abs(deltaY) * 0.015

		if (deltaX < 0 && this._helixDirection === 0) {
			this._helixDirection = -1
		}
		if (deltaX > 0 && this._helixDirection === 0) {
			this._helixDirection = 1
		}
		this._targetRotation += angleDelta * this._helixDirection

		if (Math.abs(this._targetRotation) > Math.PI * 2 * SETTINGS.TURNS) {
			this.showTaskTl?.kill()
			this.witness.material.color.set(0xffffff)
			this.isPlaying = false
			this.isShowed = false
			this._helixDirection = 0

			setTimeout(() => {
				this._targetRotation %= Math.PI * 2
				this.helix.rotation.x = -this._targetRotation
			}, 1000)

			this.trigger('task:complete', [this.score])
		}
	}

	_createListeners() {
		this.experience.interactionManager.addInteractiveObject(this.helix)
		this.helix.addEventListener('mouseenter', this._handleHelixMouseEnter)
		this.helix.addEventListener('mouseleave', this._handleHelixMouseLeave)
		this.helix.addEventListener('mousedown', this._handleHelixMouseDown)
		this.helix.addEventListener('drag', this._handleHelixDrag)
	}

	playTask() {
		this.isPlaying = true
	}

	showTask() {
		this.isShowed = true
		this.showTaskTl = gsap.to(this.witness.material.color, {
			r: 100,
			duration: 0.5,
			repeat: -1,
			yoyo: true,
		})
		this.playTask()
	}

	update() {
		this.helix.rotation.x = MathUtils.lerp(this.helix.rotation.x, -this._targetRotation, 0.01 * this.experience.time.delta)
	}

	dispose() {
		this.helix.removeEventListener('mouseenter', this._handleHelixMouseEnter)
		this.helix.removeEventListener('mouseleave', this._handleHelixMouseLeave)
		this.helix.removeEventListener('mousedown', this._handleHelixMouseDown)
		this.helix.removeEventListener('drag', this._handleHelixDrag)
		this.experience.interactionManager.removeInteractiveObject(this.helix)
		this.showTaskTl?.kill()
	}
}
