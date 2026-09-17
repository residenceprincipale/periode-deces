import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'
import { gsap } from 'gsap'
import Experience from 'core/Experience.js'
import { Object3D, Vector3 } from 'three/webgpu'

export default class Bubble {
	/**
	 * Create a Bubble.
	 * @param {Object} options - The options for the Bubble.
	 * @param {Object3D} options.bindObject - The 3D object to bind the bubble to.
	 * @param {HTMLElement} options.htmlElement - The HTML element for the bubble.
	 */
	constructor({ bindObject, htmlElement }) {
		this._bindObject = bindObject
		this._htmlElement = htmlElement

		this.experience = new Experience()

		// this._createHtmlElement()
		this._createCssObject()
	}

	_createHtmlElement() {
		this._htmlElement = document.createElement('div')
		this._htmlElement.classList.add('bubble')
		const imgElement = document.createElement('img')
		imgElement.src = '/textures/bubble.webp'
		imgElement.alt = 'bubble'
		this._textHtmlElement = document.createElement('p')
		this._textHtmlElement.classList.add('text')
		this._textHtmlElement.textContent = 'Hello, I need your help'
		this._htmlElement.appendChild(imgElement)
		this._htmlElement.appendChild(this._textHtmlElement)
	}

	_createCssObject() {
		this._bubbleCssObject = new CSS3DObject(this._htmlElement)

		this.experience.cssScene.add(this._bubbleCssObject)

		this._bubbleCssObject.position.copy(this._bindObject.position)

		this._bubbleCssObject.rotation.y = -0.5

		this._bubbleCssObject.scale.set(0)
		this._bubbleCssObject.visible = false
	}

	display() {
		const tl = gsap.timeline({
			defaults: {
				duration: 0.5,
				ease: 'steps(10)',
			},
		})
		tl.to(
			this._bubbleCssObject.position,
			{
				x: '+=0.2',
				y: '+=0.3',
			},
			0
		)
		tl.to(
			this._bubbleCssObject.scale,
			{
				x: 0.0015,
				y: 0.0015,
				z: 0.0015,
			},
			0
		)
		this._bubbleCssObject.visible = true
	}

	hide() {
		const tl = gsap.timeline({
			defaults: {
				duration: 0.5,
				ease: 'steps(10)',
			},
		})
		tl.to(
			this._bubbleCssObject.position,
			{
				...this._bindObject.position,
			},
			0
		)
		tl.to(
			this._bubbleCssObject.scale,
			{
				x: 0,
				y: 0,
				z: 0,
				onComplete: () => {
					this._bubbleCssObject.visible = false
				},
			},
			0
		)
	}
}
