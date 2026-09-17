import EventEmitter from 'core/EventEmitter.js'
import { Timer } from 'three/webgpu'

export default class Time extends EventEmitter {
	constructor() {
		super()

		this.timer = new Timer()
		this.timer.connect(document)

		this.start = 0
		this.elapsed = 0
		this.delta = 16
	}

	update(timestamp) {
		this.timer.update(timestamp)
		this.delta = this.timer.getDelta() * 1000
		this.elapsed = this.timer.getElapsed() * 1000
		this.trigger('tick')
	}

	dispose() {
		this.timer.disconnect()
	}
}
