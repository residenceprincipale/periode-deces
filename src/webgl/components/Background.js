import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three/webgpu'
import Component from 'core/Component.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import { applyObjectSettings } from 'utils/transformSettings.js'
import settings from './Background/settings.js'

export default class Background extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()
		this._applyTransform()
		this._createDebug()
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeBackgroundTexture
		texture.flipY = false
		texture.channel = 0
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.backgroundModel.scene
		this.mesh.traverse((child) => {
			if (child.isMesh) child.material = this._material
		})
		this.mesh.name = 'background'
		this.add(this.mesh)
	}

	_applyTransform() {
		applyObjectSettings(this, settings)
	}

	_createDebug() {
		if (!this.debug.active) return

		this.debug.registerFile(settings, settings.file)
		addObjectDebug(this.debug.ui, this, { title: 'Background Model', expanded: true, settings })
	}
}
