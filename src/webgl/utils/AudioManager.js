import Experience from 'core/Experience.js'
import { AudioListener, Mesh, PositionalAudio, Vector3, Audio } from 'three/webgpu'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { PositionalAudioHelper } from 'three/addons/helpers/PositionalAudioHelper.js'
import InputManager from 'utils/InputManager.js'

export default class AudioManager {
	constructor() {
		this.experience = new Experience()
		this.camera = this.experience.camera
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.debug = this.experience.debug

		this.audioContextReady = false

		this.setCameraListener()
		this.resources.on('ready', () => {
			this.audios = {
				foxPositional: {
					buffer: this.resources.items.foxAudio,
					refDistance: 20,
					loop: false,
					volume: 1,
					position: new Vector3(0, 0, 0),
					autoplay: false,
				},
				fox: {
					buffer: this.resources.items.foxAudio,
					loop: false,
					volume: 1,
					autoplay: false,
				},
			}
			this.setAudios()
			if (this.debug.active) this.setDebug()
		})

		InputManager.on('audioContextReady', () => {
			this.audioContextReady = true

			Object.keys(this.audios).forEach((key) => {
				const audio = this.audios[key]
				if (audio.autoplay) audio.instance.play()
			})
		})
	}

	setCameraListener() {
		this.audioListener = new AudioListener()
		this.camera.sceneCamera.add(this.audioListener)
	}

	setAudios() {
		Object.keys(this.audios).forEach((key) => {
			const audio = this.audios[key]
			if (audio.position) {
				audio.instance = new PositionalAudio(this.audioListener)
				audio.instance.setBuffer(audio.buffer)
				audio.instance.setRefDistance(audio.refDistance || 20)
				audio.instance.setLoop(audio.loop || false)
				audio.instance.setVolume(audio.volume || 1)
				audio.mesh = new Mesh()
				audio.mesh.add(audio.instance)
				audio.mesh.position.copy(audio.position)
				audio.mesh.name = key
				this.scene.add(audio.mesh)
			} else {
				audio.instance = new Audio(this.audioListener)
				audio.instance.setBuffer(audio.buffer)
				audio.instance.setLoop(audio.loop || false)
				audio.instance.setVolume(audio.volume || 1)
				audio.instance.name = key
			}
		})
	}

	setDebug() {
		if (!this.debug.ui) return

		const folder = this.debug.ui.addFolder('Audio Manager')
		this.debugFolder = folder

		folder.add(
			{
				playAll: () => Object.values(this.audios).forEach((audio) => audio.instance.play()),
			},
			'playAll',
		).name('Play all')
		folder.add(
			{
				stopAll: () => Object.values(this.audios).forEach((audio) => audio.instance.stop()),
			},
			'stopAll',
		).name('Stop all')

		const params = { control: false }
		folder.add(params, 'control').name('transform control').onChange((value) => {
			Object.values(this.audios).forEach((audio) => {
				if (!audio.position) return
				if (value) {
					audio.helper = new PositionalAudioHelper(audio.instance, audio.refDistance)
					audio.instance.add(audio.helper)
					audio.transform = new TransformControls(this.camera.instance, this.experience.canvas)
					audio.transform.addEventListener('change', () => {
						audio.position.copy(audio.mesh.position)
					})
					let controlsIsEnable
					audio.transform.addEventListener('dragging-changed', ({ value: dragging }) => {
						if (!this.camera.instance.controls) return
						if (dragging) {
							controlsIsEnable = this.camera.instance.controls.enabled
							this.camera.instance.controls.enabled = !dragging
						} else if (controlsIsEnable) {
							this.camera.instance.controls.enabled = !dragging
						}
					})
					audio.transform.attach(audio.mesh)
					audio.transform.getHelper().devObject = true
					this.scene.add(audio.transform.getHelper())
				} else {
					audio.helper.dispose()
					audio.instance.remove(audio.helper)
					delete audio.helper
					audio.transform.disconnect()
					this.scene.remove(audio.transform.getHelper())
					delete audio.transform
				}
			})
		})

		Object.keys(this.audios).forEach((key) => {
			const audio = this.audios[key]
			const audioFolder = folder.addFolder(key)
			audioFolder.add({ play: () => audio.instance.play() }, 'play').name('Play')
			audioFolder.add({ stop: () => audio.instance.stop() }, 'stop').name('Stop')
			audioFolder.add(audio, 'volume', 0, 1, 0.01).onChange(() => {
				audio.instance.setVolume(audio.volume)
			})
			if (audio.refDistance !== undefined) {
				audioFolder.add(audio, 'refDistance', 0, 100, 1).onChange(() => {
					audio.instance.setRefDistance(audio.refDistance)
					if (audio.helper) {
						audio.helper.range = audio.refDistance
						audio.helper.update()
					}
				})
			}
			audioFolder.add(audio, 'loop').onChange(() => {
				audio.instance.setLoop(audio.loop)
			})
			if (audio.position) {
				;['x', 'y', 'z'].forEach((axis) => {
					audioFolder.add(audio.position, axis).name(`position.${axis}`).onChange(() => {
						audio.mesh.position.copy(audio.position)
					})
				})
			}
		})
	}
}
