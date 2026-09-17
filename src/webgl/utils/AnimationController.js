import { AnimationMixer, LoopOnce, LoopPingPong, LoopRepeat } from 'three/webgpu'

/**
 * AnimationController class
 * This class is used to control animations for a 3D model.
 * @param {Object} options - The options for the AnimationController.
 * @param {Object3D} options.model - The 3D model to animate.
 * @param {Array<AnimationClip>} options.animations - The array of AnimationClip objects for the model.
 */
export default class AnimationController {
	constructor(options) {
		this.model = options.model
		this.animations = options.animations

		this.mixer = new AnimationMixer(options.model)

		/**
		 * @type {Object<string, AnimationAction>}
		 */
		this.actions = {}
		this.#setupActions()
	}

	/**
	 * Updates the mixer with the given deltaTime.
	 * @param {number} deltaTime - The time since the last frame.
	 */
	update(deltaTime) {
		this.mixer.update(deltaTime)
	}

	/**
	 * Plays the animation with the given name.
	 *
	 * @param {string} name - The name of the animation.
	 * @param {Object} options - The options for the animation.
	 * @param {boolean} options.loop - Whether the animation should loop. Default is false.
	 * @param {number} options.speed - The speed of the animation. Default is 1.
	 * @param {number} options.start - The start time of the animation. Default is 0.
	 * @param {boolean} options.yoyo - Whether the animation should alternate directions each loop. Default is false.
	 *
	 * @throws {Error} If the animation does not exist.
	 */
	playAnimation(name, { loop = false, speed = 1, start = 0, yoyo = false } = {}) {
		this.current = this.actions[name]
		if (!this.current) throw new Error(`AnimationController: Animation ${name} does not exist.`)
		this.current.name = name

		this.current.loop = loop ? LoopRepeat : LoopOnce
		this.current.repetitions = loop ? Infinity : 1
		this.current.clampWhenFinished = yoyo || !loop

		if (yoyo) {
			this.current.loop = LoopPingPong
			this.current.repetitions = loop ? Infinity : 2
		}

		this.current.paused = false
		this.current.enabled = true
		this.current.play()
		this.current.timeScale = speed
		this.current.time = start
	}

	/**
	 * Fades from the current animation to another.
	 *
	 * @param {string} to - The name of the animation to fade to.
	 * @param {Object} options - The options for the fade.
	 * @param {boolean} options.loop - Whether the animation should loop. Default is false.
	 * @param {number} options.speed - The speed of the animation. Default is 1.
	 * @param {number} options.start - The start time of the animation. Default is 0.
	 * @param {boolean} options.yoyo - Whether the animation should alternate directions each loop. Default is false.
	 * @param {number} options.duration - The duration of the fade. Default is 1.
	 *
	 * @throws {Error} If the current animation or the animation to fade to does not exist.
	 */
	fadeAnimation(to, { loop = false, speed = 1, start = 0, yoyo = false, duration = 1 } = {}) {
		if (!this.current) {
			this.playAnimation(to, { loop, speed, start, yoyo })
			return
		}
		const toAction = this.actions[to]
		if (!toAction) throw new Error(`AnimationController: Animation ${to} does not exist.`)

		this.current.crossFadeTo(toAction, duration)
		this.playAnimation(to, { loop, speed, start, yoyo })
	}

	/**
	 * Sets the progress of the animation with the given name.
	 *
	 * @param {string} [name=this.current.name] - The name of the animation. Defaults to the current animation.
	 * @param {number} progress - The progress to set the animation to, as a fraction of the total duration.
	 *
	 * @throws {Error} If the animation does not exist.
	 */
	setAnimationProgress(name = this.current.name, progress) {
		this.playAnimation(name)

		const progressTime = this.current.getClip().duration * progress
		this.actions[name].paused = true

		this.actions[name].time = progressTime
	}

	/**
	 * Gets the progress of the animation with the given name.
	 *
	 * @param {string} [name=this.current.name] - The name of the animation. Defaults to the current animation.
	 *
	 * @returns {number} The progress of the animation, as a fraction of the total duration.
	 *
	 * @throws {Error} If the animation does not exist.
	 */
	getAnimationProgress(name = this.current.name) {
		const action = this.actions[name]
		if (!action) throw new Error(`Animation "${name}" does not exist.`)
		return action.time / action.getClip().duration
	}

	/**
	 * Sets up the debug controls for the AnimationController.
	 *
	 * @param {Object} debugFolder - The debug folder to add the controls to.
	 */
	setDebug(debugFolder) {
		const folder = debugFolder.addFolder('AnimationController')

		Object.keys(this.actions).forEach((name) => {
			folder.add({ [name]: () => this.fadeAnimation(name, { loop: true }) }, name)
		})

		if (!this.current) return

		folder.add(this.current, 'paused')
		folder.add(this.current, 'time', 0, this.current.getClip().duration, 0.01).listen()
		folder.add(this.current, 'timeScale', -1, 2, 0.01)
		folder.add(this.current, 'loop', { Loop: LoopRepeat, Once: LoopOnce, PingPong: LoopPingPong }).onChange((value) => {
			this.current.enabled = true
			this.current.loop = value
		})
	}

	#pauseAllActions() {
		Object.keys(this.actions).forEach((action) => {
			this.actions[action].paused = true
		})
	}

	#unPauseAllActions() {
		Object.keys(this.actions).forEach((action) => {
			this.actions[action].paused = false
		})
	}

	#setupActions() {
		this.animations.forEach((animation) => {
			this.actions[animation.name] = this.mixer.clipAction(animation)
		})
	}
}
