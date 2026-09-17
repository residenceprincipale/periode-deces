import Experience from 'core/Experience.js'

export default class Debug {
	constructor() {
		this.experience = new Experience()
		this.active = window.location.hash === '#debug'
		this.files = []
		this.debugParams = {
			ResourceLog: true,
			LoadingScreen: true,
		}
	}

	attach(inspector) {
		this.inspector = inspector
		inspector.domElement.style.setProperty('--font-family', 'Arial, Helvetica, sans-serif')
		inspector.domElement.style.setProperty('--font-mono', 'Arial, Helvetica, sans-serif')
		inspector.domElement.style.fontFamily = 'Arial, Helvetica, sans-serif'
		this.ui = inspector.createParameters('Project')
		this.ui.add({ save: () => this.save() }, 'save').name('Save')
	}

	registerFile(data, file) {
		this.files.push({ data, file })
	}

	save() {
		return Promise.all(
			this.files.map(({ data, file }) =>
				fetch('/debug/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ data, file }),
				}),
			),
		)
	}

	setEventsFolder(events = []) {
		if (!this.ui || !events.length) return

		const folder = this.ui.addFolder('Events')
		const actions = {}

		events.forEach(({ title, start }) => {
			actions[title] = start
			folder.add(actions, title)
		})
	}

	update() {}
}
