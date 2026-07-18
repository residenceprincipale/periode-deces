import Experience from 'core/Experience.js'
import { gsap } from 'gsap'
import { MeshBasicMaterial, Vector2 } from 'three'
import Component from 'core/Component.js'
import Bubble from './Bubble'
import { isContinueKey } from '@/webgl/utils/keyboardControls.js'

export default class Phone extends Component {
	constructor() {
		super()

		this.experience = new Experience()
		this.scene = this.experience.scene
		this.camera = this.experience.camera.instance
		this.resources = this.scene.resources
		this.score = 10
		this.calling = new Audio('/audio/phone/calling.wav')
		this.calling.loop = true
		this.talking = new Audio('/audio/phone/talking.mp3')
		this.talking.loop = true
		this.closeCall = new Audio('/audio/phone/close_call.mp3')

		this._createMaterial()
		this._createMesh()
		this._createListeners()
		this._bubble = new Bubble({ bindObject: this._baseModel, htmlElement: document.querySelector('.bubble') })
	}

	_createMaterial() {
		const texture = this.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this._mesh = this.resources.items.phoneModel.scene.clone()
		this._mesh.name = 'phone'

		this._mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material

				if (child.name === 'tel') {
					this._telModel = child
				} else if (child.name === 'base') {
					this._baseModel = child
				}
			}
		})

		this._baseTelValues = {
			rotation: this._telModel.rotation.clone(),
			position: this._telModel.position.clone(),
		}
		this._createShakeAnim()
		this._createAnswerAnim()
		this._createResetAnim()

		this.add(this._mesh)
	}

	_angryBubbleAnim() {}

	_createListeners() {
		this.experience.interactionManager.addInteractiveObject(this._mesh)
		this._mesh.addEventListener('click', this._handleMouseClick)
		this._mesh.addEventListener('mouseenter', this._handleMouseEnter)
		this._mesh.addEventListener('mouseleave', this._handleMouseLeave)
	}

	_handleMouseClick = () => {
		if (!this.isShowed || this.isPlaying) return
		this.playTask()
	}

	_handleMouseEnter = () => {
		if (this.isShowed && !this.isPlaying) this.experience.canvas.style.cursor = 'pointer'
	}

	_handleMouseLeave = () => {
		this.experience.canvas.style.cursor = ''
	}

	/**
	 * Activate the CTA of the call (ringing)
	 */
	showTask() {
		this.isShowed = true
		this._shakeAnim.play()
		this.calling.volume = 0.2
		this.calling.play()
	}

	playTask() {
		this.isPlaying = true
		this._shakeAnim.pause()
		this.calling.pause()
		this._answerAnim.play(0)
		this._bubble.display()
		this.experience.subtitlesManager.playSubtitle('client')
		const handleDown = (event) => {
			if (isContinueKey(event)) {
				this.experience.subtitlesManager.next()
			}
		}
		addEventListener('keydown', handleDown)
		this.experience.subtitlesManager.on('finish', () => {
			this._bubble.hide()
			this._resetAnim.play(0)
			this.trigger('task:complete', [this.score])
			removeEventListener('keydown', handleDown)
			this.isPlaying = false
			this.isShowed = false
		})
	}

	_createAnswerAnim() {
		const duration = 0.5

		const target = new Vector2()
		this.camera.getViewSize(1, target) // result written to target
		const dist = target.x * 0.5

		this._answerAnim = gsap
			.timeline({ paused: true })
			.to(
				this._telModel.rotation,
				{
					duration,
					x: -Math.PI / 2,
					z: Math.PI / 2,
					ease: 'steps(10)',
				},
				0
			)
			.to(
				this._telModel.position,
				{
					duration,
					x: this.camera.position.x - dist,
					y: this.camera.position.y,
					z: this.camera.position.z,
					ease: 'steps(10)',
				},
				0
			)
	}

	_createShakeAnim() {
		const duration = 0.5
		this._shakeAnim = gsap.timeline({ repeat: -1, yoyo: true, paused: true })

		this._shakeAnim.to(
			this._telModel.rotation,
			{
				duration: duration - duration / 3,
				delay: duration / 3,
				x: this._telModel.rotation.x + 0.1,
				y: this._telModel.rotation.y + 0.1,
				z: this._telModel.rotation.z - 0.05,
				ease: 'bounce.out',
			},
			0
		)

		this._shakeAnim.to(
			this._telModel.position,
			{
				duration,
				y: this._telModel.position.y + 0.1,
				ease: 'bounce.out',
			},
			0
		)
	}

	_createResetAnim() {
		const duration = 0.5
		this._resetAnim = gsap
			.timeline({ paused: true })
			.to(
				this._telModel.rotation,
				{
					duration,
					x: this._baseTelValues.rotation.x,
					y: this._baseTelValues.rotation.y,
					z: this._baseTelValues.rotation.z,
					ease: 'steps(10)',
				},
				0
			)
			.to(
				this._telModel.position,
				{
					duration,
					x: this._baseTelValues.position.x,
					y: this._baseTelValues.position.y,
					z: this._baseTelValues.position.z,
					ease: 'steps(10)',
					onComplete: () => {
						this.closeCall.play()
					},
				},
				0
			)
	}
}
