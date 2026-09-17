import Experience from 'core/Experience.js'
import { DoubleSide, MeshBasicMaterial, MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, cos, positionLocal, sin, texture, time, uniform, uv, vec3 } from 'three/tsl'
import Component from 'core/Component.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import { applyObjectSettings } from 'utils/transformSettings.js'
import { gsap } from 'gsap'
import settings from './WallFan/settings.js'

const TEXTURE_MAP = {
	'fan-base': 'wallFanWallmountTexture',
	fan: 'wallFanMotorTexture',
	bill: 'wallFanPantieBillTexture',
	'fan-pale': 'wallFanMotorTexture',
	pantie: 'wallFanPantieBillTexture',
}

const FAN_PALE_DURATION = 0.1
const FAN_SWING_ANGLE = 0.4
const FAN_SWING_DURATION = 3

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

	_createWindMaterial({ map, phase, timeOffset }) {
		const uPhase = uniform(phase)
		const uTimeOffset = uniform(timeOffset)
		const { amplitude, frequency, speed } = this._windUniforms
		const material = new MeshBasicNodeMaterial({
			side: DoubleSide,
			transparent: true,
		})

		material.positionNode = Fn(() => {
			const vUv = uv()
			const pos = positionLocal
			const t = time.add(uTimeOffset).mul(speed).add(uPhase)

			const primary = sin(pos.y.mul(frequency).add(t))
			const cross = cos(pos.y.mul(frequency).mul(1.63).add(t.mul(1.37)).add(1.4)).mul(0.55)
			const ripple = sin(vUv.x.mul(frequency).mul(2.8).sub(t.mul(0.9)).add(uPhase.mul(0.5))).mul(0.4)
			const gust = sin(pos.y.mul(frequency).mul(0.35).sub(t.mul(0.45)).add(uPhase)).mul(0.35)
			const flutter = cos(vUv.x.mul(frequency).mul(4.2).add(t.mul(1.8)).sub(uPhase))
				.mul(sin(pos.y.mul(frequency).mul(0.8).add(t)))
				.mul(0.25)

			const displacement = primary.add(cross).add(ripple).add(gust).add(flutter).mul(0.45)
			return pos.add(vec3(0, displacement.mul(amplitude).mul(vUv.x), 0))
		})()

		material.colorNode = texture(map)
		material.userData.wind = { uPhase, uTimeOffset }
		return material
	}

	_createMaterials() {
		this._materials = {}

		for (const textureName of new Set(Object.values(TEXTURE_MAP))) {
			const map = this.resources.items[textureName]
			map.flipY = false
			this._materials[textureName] = new MeshBasicMaterial({ map })
		}

		const windTexture = this.resources.items.wallFanPantieBillTexture
		windTexture.flipY = false

		this._windUniforms = {
			amplitude: uniform(settings.wind.amplitude),
			frequency: uniform(settings.wind.frequency),
			speed: uniform(settings.wind.speed),
		}

		this._windMaterials = {
			bill: this._createWindMaterial({
				map: windTexture,
				phase: settings.wind.bill.phase,
				timeOffset: settings.wind.bill.timeOffset,
			}),
			pantie: this._createWindMaterial({
				map: windTexture,
				phase: settings.wind.pantie.phase,
				timeOffset: settings.wind.pantie.timeOffset,
			}),
		}
	}

	_createMesh() {
		this.mesh = this.resources.items.wallFanModel.scene.clone()
		this.mesh.name = 'wall-fan'

		this.mesh.traverse((child) => {
			if (!child.isMesh) return

			if (child.name === 'bill' || child.name === 'pantie') {
				child.material = this._windMaterials[child.name]
			} else {
				const textureName = TEXTURE_MAP[child.name]
				if (textureName) child.material = this._materials[textureName]
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
	}

	_applyTransform() {
		applyObjectSettings(this, settings)
	}

	_createAnimations() {
		this._fanPaleTl = gsap.to(this.fanPale.rotation, {
			z: Math.PI * 2,
			duration: FAN_PALE_DURATION,
			repeat: -1,
			ease: 'none',
		})

		this._fanSwingTl = gsap.fromTo(
			this.fanPivot.rotation,
			{ y: -FAN_SWING_ANGLE },
			{
				y: FAN_SWING_ANGLE,
				duration: FAN_SWING_DURATION,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
			},
		)
	}

	dispose() {
		this._fanPaleTl?.kill()
		this._fanSwingTl?.kill()
		Object.values(this._windMaterials).forEach((material) => material.dispose())
	}

	_createDebug() {
		if (!this.debug.active) return

		this.debug.registerFile(settings, settings.file)
		const folder = addObjectDebug(this.debug.ui, this, { title: 'Wall Fan', expanded: true, settings })
		if (!folder) return

		const wind = folder.addFolder('wind')
		;['amplitude', 'frequency', 'speed'].forEach((key) => {
			wind.add(settings.wind, key).onChange((value) => {
				this._windUniforms[key].value = value
			})
		})

		wind.add(settings.wind.bill, 'phase').name('bill.phase').onChange((value) => {
			this._windMaterials.bill.userData.wind.uPhase.value = value
		})
		wind.add(settings.wind.bill, 'timeOffset').name('bill.timeOffset').onChange((value) => {
			this._windMaterials.bill.userData.wind.uTimeOffset.value = value
		})
		wind.add(settings.wind.pantie, 'phase').name('pantie.phase').onChange((value) => {
			this._windMaterials.pantie.userData.wind.uPhase.value = value
		})
		wind.add(settings.wind.pantie, 'timeOffset').name('pantie.timeOffset').onChange((value) => {
			this._windMaterials.pantie.userData.wind.uTimeOffset.value = value
		})
	}
}
