import Experience from 'core/Experience.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { applyTransformSettings, syncTransformSettings } from 'utils/transformSettings.js'

function addVec3(folder, target, name, onChange) {
	;['x', 'y', 'z'].forEach((axis) => {
		const controller = folder.add(target, axis).name(`${name}.${axis}`).listen()
		if (onChange) controller.onChange(onChange)
	})
}

export default class useTransformControls {
	constructor(object, debugFolder, name, settings) {
		if (!object) throw new Error('useTransformControls: object is undefined')

		this.experience = new Experience()
		this.camera = this.experience.camera
		this.canvas = this.experience.canvas
		this.scene = this.experience.scene

		this.options = { object, debugFolder, name, settings }

		this.setInstance()
		if (debugFolder) this.setDebugFeature()
		return this.instance
	}

	setInstance() {
		this.instance = new TransformControls(this.camera.instance, this.canvas)

		let controlsIsEnable
		this.instance.addEventListener('dragging-changed', ({ value }) => {
			if (!this.instance.camera.controls) return
			if (value) {
				controlsIsEnable = this.instance.camera.controls.enabled
				this.instance.camera.controls.enabled = !value
			} else if (controlsIsEnable) {
				this.instance.camera.controls.enabled = !value
			}
		})

		this.instance.name = 'transformControl'
		this.instance.getHelper().devObject = true
		this.scene.add(this.instance.getHelper())

		if (this.options.object.parent === null) {
			this.options.object.devObject = true
			this.scene.add(this.options.object)
		}

		this.instance.attach(this.options.object)
		if (this.options.debugFolder) this.instance.enabled = this.instance.getHelper().visible = false
	}

	setDebugFeature() {
		const { object, debugFolder, settings } = this.options
		const params = { control: false }

		const modeCtrl = debugFolder.add(this.instance, 'mode', ['translate', 'rotate', 'scale']).name('mode')
		modeCtrl.hide()

		debugFolder
			.add(params, 'control')
			.name(this.options.name || 'transform control')
			.onChange((value) => {
				this.instance.camera = this.camera.instance
				this.instance.enabled = this.instance.getHelper().visible = value
				value ? modeCtrl.show() : modeCtrl.hide()
			})

		const transformTarget = settings ?? object
		const applyFromSettings = () => applyTransformSettings(object, settings)

		addVec3(debugFolder, transformTarget.position, 'position', settings && applyFromSettings)
		addVec3(debugFolder, transformTarget.rotation, 'rotation', settings && applyFromSettings)
		addVec3(debugFolder, transformTarget.scale, 'scale', settings && applyFromSettings)

		this.instance.addEventListener('change', () => {
			if (settings) syncTransformSettings(object, settings)
			object.helper?.update()
		})
	}
}
