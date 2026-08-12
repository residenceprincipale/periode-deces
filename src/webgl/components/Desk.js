import Experience from 'core/Experience.js'
import { MeshBasicMaterial, PlaneGeometry, Mesh } from 'three'
import Component from 'core/Component.js'

export default class Desk extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()
		this._createPostIts()

		this._createListeners()
	}

	_createListeners() {
		const baseMousePosition = this.mouseObject.position.clone()
		addEventListener('mousemove', (event) => {
			const x = (event.clientX / this.experience.sizes.width) * 2 - 1
			const y = (event.clientY / this.experience.sizes.height) * 2 - 1

			this.mouseObject.position.x = baseMousePosition.x + x * 0.1
			this.mouseObject.position.z = baseMousePosition.z + y * 0.1
		})
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.deskModel.scene.clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				if (child.name === '_NAS') {
					// child.geometry.attributes.uv = child.geometry.attributes.uv1.clone()
					child.material = new MeshBasicMaterial({ color: 0x333333, side: 0 })
				}
				if (child.name === 'Souris') {
					this.mouseObject = child
				}
			}
		})
		this.mesh.name = 'background'
		this.add(this.mesh)
	}

	_createPostIts() {
		const geometry = new PlaneGeometry(1, 1)
		const texture1 = this.scene.resources.items.postItZiziTexture
		const material1 = new MeshBasicMaterial({ map: texture1 })
		const postIt1 = new Mesh(geometry, material1)
		let scale = 0.3
		postIt1.scale.set(scale, scale, scale)
		postIt1.position.set(-1.15, 1.7, -1)
		postIt1.rotation.set(-0.2, 0, -0.2)
		this.scene.add(postIt1)

		const texture2 = this.scene.resources.items.postItWolfTexture
		const material2 = new MeshBasicMaterial({ map: texture2 })
		const postIt2 = new Mesh(geometry, material2)
		postIt2.position.set(1.7, 1.7, -1)
		postIt2.rotation.set(-0.2, 0, 0.2)
		scale = 0.4
		postIt2.scale.set(scale, scale, scale)
		this.scene.add(postIt2)

		const texture3 = this.scene.resources.items.posterWolfTexture
		const material3 = new MeshBasicMaterial({ map: texture3, transparent: false })
		const poster = new Mesh(geometry, material3)
		poster.position.set(1.65, 2.05, -1.05)
		poster.rotation.set(-0, 0, -0.1)
		scale = 0.5
		poster.scale.set(scale, scale, scale)
		this.scene.add(poster)

		const texture4 = this.scene.resources.items.posterGirlTexture
		const material4 = new MeshBasicMaterial({ map: texture4, transparent: false })
		const poster2 = new Mesh(geometry, material4)
		poster2.position.set(-1.4, 2, -1.05)
		poster2.rotation.set(-0, 0, 0.1)
		scale = 0.4
		poster2.scale.set(scale, scale, scale)
		this.scene.add(poster2)
	}
}
