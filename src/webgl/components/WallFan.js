import Experience from 'core/Experience.js'
import { DoubleSide, MeshBasicMaterial, ShaderMaterial } from 'three'
import Component from 'core/Component.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import { applyObjectSettings } from 'utils/transformSettings.js'
import { gsap } from 'gsap'
import settings from './WallFan/settings.js'
import windVertexShader from './WallFan/windVertex.vert'
import windFragmentShader from './WallFan/windFragment.frag'

const TEXTURE_MAP = {
	'fan-base': 'wallFanWallmountTexture',
	fan: 'wallFanMotorTexture',
	bill: 'wallFanPantieBillTexture',
	'fan-pale': 'wallFanMotorTexture',
	pantie: 'wallFanPantieBillTexture',
}

export default class WallFan extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.debug = this.experience.debug

		this._createMaterials()
		this._createMesh()
		this._applyTransform()
		this._createAnimations()
		this._createDebug()
	}

	_createMaterials() {
		this._materials = {}

		for (const textureName of new Set(Object.values(TEXTURE_MAP))) {
			const texture = this.resources.items[textureName]
			texture.flipY = false
			this._materials[textureName] = new MeshBasicMaterial({ map: texture })
		}

		const windTexture = this.resources.items.wallFanPantieBillTexture
		windTexture.flipY = false

		this._windMaterial = new ShaderMaterial({
			vertexShader: windVertexShader,
			fragmentShader: windFragmentShader,
			uniforms: {
				uTexture: { value: windTexture },
				uTime: { value: 0 },
				uTimeOffset: { value: 0 },
				uAmplitude: { value: settings.wind.amplitude },
				uFrequency: { value: settings.wind.frequency },
				uSpeed: { value: settings.wind.speed },
				uPhase: { value: 0 },
			},
			side: DoubleSide,
			transparent: true,
		})
	}

	_createMesh() {
		this.mesh = this.resources.items.wallFanModel.scene.clone()
		this.mesh.name = 'wall-fan'

		this.mesh.traverse((child) => {
			if (!child.isMesh) return

			if (child.name === 'bill' || child.name === 'pantie') {
				const windConfig = settings.wind[child.name]
				child.material = this._windMaterial.clone()
				child.material.uniforms.uPhase.value = windConfig.phase
				child.material.uniforms.uTimeOffset.value = windConfig.timeOffset
			} else {
				const textureName = TEXTURE_MAP[child.name]
				if (textureName) {
					child.material = this._materials[textureName]
				}
			}

			switch (child.name) {
				case 'fan-base':
					this.fanBase = child
					break
				case 'fan':
					this.fan = child
					break
				case 'bill':
					this.bill = child
					break
				case 'fan-pale':
					this.fanPale = child
					break
				case 'pantie':
					this.pantie = child
					break
			}
		})

		this.add(this.mesh)

		this.fanPivot = this.mesh.getObjectByName('fan')
		this.fanPale = this.mesh.getObjectByName('fan-pale')
		this._windMeshes = [this.bill, this.pantie].filter(Boolean)
	}

	_applyTransform() {
		applyObjectSettings(this, settings)
	}

	_createAnimations() {
		this._fanPaleTl = gsap.to(this.fanPale.rotation, {
			z: Math.PI * 2,
			duration: settings.animation.fanPaleDuration,
			repeat: -1,
			ease: 'none',
		})

		this._fanSwingTl = gsap.fromTo(
			this.fanPivot.rotation,
			{ y: -settings.animation.fanSwingAngle },
			{
				y: settings.animation.fanSwingAngle,
				duration: settings.animation.fanSwingDuration,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
			},
		)
	}

	update() {
		const time = this.experience.time.elapsed * 0.001
		this._windMeshes?.forEach((mesh) => {
			mesh.material.uniforms.uTime.value = time
		})
	}

	dispose() {
		this._fanPaleTl?.kill()
		this._fanSwingTl?.kill()
		this._windMaterial?.dispose()
		this._windMeshes?.forEach((mesh) => mesh.material.dispose())
	}

	_createDebug() {
		if (!this.debug.active) return

		this.debug.registerFile(settings, settings.file)
		addObjectDebug(this.debug.ui, this, { title: 'Wall Fan', expanded: true, settings })
	}
}
