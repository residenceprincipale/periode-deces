import Experience from 'core/Experience.js'
import { BoxGeometry, Mesh, MeshBasicNodeMaterial, Vector3 } from 'three/webgpu'
import { uniform, uv, vec4 } from 'three/tsl'
import addObjectDebug from 'utils/addObjectDebug.js'

export default class Cube {
	constructor(_position = new Vector3(0, 0, 0)) {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.position = _position

		this.setGeometry()
		this.setMaterial()
		this.setMesh()
		this.setInteraction()
	}

	setGeometry() {
		this.geometry = new BoxGeometry(1, 1, 1)
	}

	setMaterial() {
		const uOpacity = uniform(1)
		this.material = new MeshBasicNodeMaterial({ transparent: true })
		this.material.colorNode = vec4(uv(), 1, uOpacity)
		this.material.userData.debugUniforms = { uOpacity }
	}

	setMesh() {
		this.mesh = new Mesh(this.geometry, this.material)
		this.mesh.position.copy(this.position)
		this.mesh.name = 'cube'
		this.scene.add(this.mesh)

		if (this.debug.active) addObjectDebug(this.experience.debug.ui, this.mesh)
	}

	setInteraction() {
		this.experience.interactionManager.addInteractiveObject(this.mesh)
		this.mesh.addEventListener('click', () => {
			console.log('cube click')
		})
	}
}
