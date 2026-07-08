import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three'
import Component from 'core/Component.js'
import addObjectDebug from 'utils/addObjectDebug.js'

export default class Background extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()
		this._createDebug()
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeBackgroundTexture
		texture.flipY = false
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.backgroundModel.scene.clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				// console.log(child.name)
				if (child.name === 'Cork001') {
					// console.log(child.geometry.attributes)
					child.geometry.attributes.uv = child.geometry.attributes.uv1.clone()
				}
			}
		})
		this.mesh.name = 'background'
		this.add(this.mesh)
	}

	_createDebug() {
		if (!this.debug.active) return

		addObjectDebug(this.debug.ui, this, { title: 'Background Model', expanded: true })
	}
}
