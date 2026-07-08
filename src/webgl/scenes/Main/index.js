import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import WallFan from 'components/WallFan.js'
import Computer from 'components/Computer/index.js'
import Background from 'components/Background.js'
import Phone from 'components/Phone.js'
import Desk from 'components/Desk.js'
import Head from 'components/Head.js'
import gsap from 'gsap'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.axis = this.experience.axis
		this.scene.resources = new Resources(sources)

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false

		this.scene.resources.on('ready', () => {
			this._start()
		})
	}

	_start() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')

		this._createSceneComponents()
		this._randomTasks()
		this._createScore()
	}

	_createScore() {
		const scoreElement = document.querySelector('.score')
		this._score = 0
		scoreElement.textContent = this._score

		const handleComplete = (score) => {
			this._score += score
			scoreElement.textContent = this._score
		}

		this.tasks.forEach((task) => {
			task.on('task:complete', handleComplete)
		})
	}

	_reset() {
		this.tasks.forEach((task) => {
			task.reset()
		})

		this.focusTasks.forEach((task) => {
			task.reset()
		})

		this._isGameStarted = false

		this._isGameOver = false
	}

	_createSceneComponents() {
		this.background = new Background()
		this.scene.add(this.background)
		this.desk = new Desk()
		this.scene.add(this.desk)

		this.head = new Head()
		this.scene.add(this.head)
		this.focusTasks.push(this.head)

		this.fan = new Fan()
		this.scene.add(this.fan)
		this.tasks.push(this.fan)

		this.wallFan = new WallFan()
		this.scene.add(this.wallFan)

		this.computer = new Computer()
		this.scene.add(this.computer)
		this.tasks.push(this.computer)

		this.phone = new Phone()
		this.scene.add(this.phone)
		this.tasks.push(this.phone)
	}

	_randomTasks(timeout = 5000) {
		setInterval(() => {
			const randomIndex = Math.floor(Math.random() * this.tasks.length)
			const randomTask = this.tasks[randomIndex]

			if (randomTask.isPlaying || randomTask.isShowed) return
			randomTask.showTask()
		}, timeout)
	}

	_randomFocusTasks = (timeout = 30000) => {
		let randomTask
		const repeat = () => {
			if (this.tasks.find((task) => task.mesh.name === 'phone').isPlaying) {
				//prevent subtitle conflict
				setTimeout(this._randomFocusTasks, timeout)
				return
			}
			const randomIndex = Math.floor(Math.random() * this.focusTasks.length)
			randomTask = this.focusTasks[randomIndex]
			randomTask.playTask()
		}

		const handleComplete = () => {
			setTimeout(repeat, timeout)
			randomTask.off('task:complete', handleComplete)
		}
		setTimeout(repeat, timeout)
	}

	_playStartAnimation() {
		const startTimeline = gsap.timeline()

		startTimeline.to(this._startMenuElement, { autoAlpha: 0, duration: 0.5, ease: 'sine.inOut' }, 0)
		startTimeline.to(this._dayPanelElement, { autoAlpha: 1, duration: 0.25, ease: 'sine.inOut' }, 0)
		startTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 0,
				delay: 0.5,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this._randomTasks()
					// this._randomFocusTasks()
				},
			},
			1
		)
	}

	_playGameOverAnimation() {
		const gameOverTimeline = gsap.timeline()

		gameOverTimeline.to(this._gameOverElement, {
			opacity: 1,
			duration: 0.25,
			ease: 'sine.inOut',
			onComplete: () => {
				this.axis.on('down', (e) => {
					if (e.key === 'a') {
						window.location.reload()
					}
				})
			},
		})
	}

	update() {
		if (this.fan) this.fan.update()
		if (this.wallFan) this.wallFan.update()
		if (this.computer) this.computer.update()
	}
}
