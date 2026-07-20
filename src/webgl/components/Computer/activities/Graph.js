import { gsap } from 'gsap'

import Experience from 'core/Experience.js'
import EventEmitter from '@/webgl/core/EventEmitter'

const GRAPH_REFERENCE = { width: 85, height: 40 }
const GRAPH_TEMPLATE = [
	{ x: 0, y: 35 },
	{ x: 10, y: 20 },
	{ x: 15, y: 25 },
	{ x: 20, y: 30 },
	{ x: 30, y: 20 },
	{ x: 35, y: 5 },
	{ x: 40, y: 25 },
	{ x: 50, y: 10 },
	{ x: 55, y: 30 },
	{ x: 60, y: 20 },
	{ x: 70, y: 10 },
	{ x: 75, y: 30 },
	{ x: 85, y: 0 },
]

export default class Graph extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.camera = this.experience.camera
		this.resources = this.scene.resources

		this.score = 10

		this._element = document.body.querySelector('.graph')
		this._notification = this._element.querySelector('.notification')
		this._activity = this._element.querySelector('.activity')
		this._graphCanvas = this._element.querySelector('.canvas')
		this._scoreNumber = this._element.querySelector('.number')
		this._completedElement = this._element.querySelector('.completed')

		this._setupCanvas()

		// Graph data and settings
		this.originalGraph = this._generateRandomGraph() // Random trading graph (hard coded for now)
		this.userGraph = [] // The user's graph based on key inputs
		this.currentX = 0 // Track the current position in X
		this.currentY = 0
		this.graphScore = 0 // score is not an actual score for now its just percentages
		this._syncGameplayScale()
		this._resetUserGraphPosition()
		this.isGameActive = false
	}

	showTask() {
		this._notification.classList.add('is-visible')
	}

	playTask(side) {
		this._side = side
		this._bindEvents()

		this._notification.classList.remove('is-visible')
		this._activity.classList.add('is-visible')
		this._setupCanvas()
		this.originalGraph = this._generateRandomGraph()
		this._resetUserGraphPosition({ seedGraph: true })

		this.isGameActive = true
	}

	end() {
		// make element blink opacity 3 times
		gsap.to(this._completedElement, {
			duration: 0.4,
			autoAlpha: 1,
			repeat: 4,
			yoyo: true,
			ease: 'steps(1)',
			onComplete: () => {
				this.trigger('end') // call to parent
			},
		})
	}

	hide() {
		this._activity.classList.remove('is-visible')
		gsap.set(this._completedElement, { autoAlpha: 0 })
	}

	reset() {
		this.isGameActive = false
		this.graphScore = 0
		this._resetUserGraphPosition()

		this._joystickInterval && clearInterval(this._joystickInterval)
		this._joystickInterval = null
		this._joystickBottom = false
		this._joystickTop = false

		removeEventListener('keydown', this._handleKeyDown)
		removeEventListener('keyup', this._handleKeyUp)

		gsap.killTweensOf(this._completedElement)
		this._notification.classList.remove('is-visible')
		this._activity.classList.remove('is-visible')
		gsap.set(this._completedElement, { autoAlpha: 0 })
	}

	_setupCanvas() {
		this._displayWidth = this._graphCanvas.clientWidth
		this._displayHeight = this._graphCanvas.clientHeight

		if (!this._displayWidth || !this._displayHeight) return

		this._pixelRatio = 1

		this._graphCanvas.width = this._displayWidth * this._pixelRatio
		this._graphCanvas.height = this._displayHeight * this._pixelRatio

		this.context = this._graphCanvas.getContext('2d')
		this.context.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0)
		this.context.imageSmoothingEnabled = false

		this._syncGameplayScale()
	}

	_syncGameplayScale() {
		if (!this._displayWidth || !this._displayHeight) return

		const scaleX = this._displayWidth / GRAPH_REFERENCE.width
		const scaleY = this._displayHeight / GRAPH_REFERENCE.height

		this.drawingSpeed = 2 * scaleX
		this._verticalStep = 5 * scaleY
	}

	_scaleGraphPoint({ x, y }) {
		const scaleX = this._displayWidth / GRAPH_REFERENCE.width
		const scaleY = this._displayHeight / GRAPH_REFERENCE.height

		return {
			x: x * scaleX,
			y: y * scaleY,
		}
	}

	_getGraphStartPoint() {
		return this._scaleGraphPoint(GRAPH_TEMPLATE[0])
	}

	_resetUserGraphPosition({ seedGraph = false } = {}) {
		const start = this._getGraphStartPoint()
		this.currentX = start.x
		this.currentY = start.y
		this.userGraph = seedGraph ? [{ x: start.x, y: start.y }] : []
	}

	resize() {
		this._setupCanvas()
		this.originalGraph = this._generateRandomGraph()

		if (!this.isGameActive) {
			this._resetUserGraphPosition()
		}
	}

	update() {
		if (!this.isGameActive) return
		this._draw()
	}

	// Generate a random trading graph to follow
	_generateRandomGraph() {
		if (!this._displayWidth || !this._displayHeight) return []

		return GRAPH_TEMPLATE.map((point) => this._scaleGraphPoint(point))
	}

	_drawOriginalGraph() {
		this.context.beginPath()
		this.originalGraph.forEach((point, index) => {
			if (index === 0) {
				this.context.moveTo(point.x, point.y)
			} else {
				this.context.lineTo(point.x, point.y)
			}
		})
		this.context.strokeStyle = '#CCCCCC' // Light gray color for the original graph
		this.context.lineWidth = 1 // Slightly thicker line for better visibility
		this.context.stroke()
	}

	_draw() {
		this.context.fillStyle = '#FFFFFF'
		this.context.fillRect(0, 0, this._displayWidth, this._displayHeight)

		this._drawGrid()
		this._drawOriginalGraph()
		this._drawUserGraph()
		this._calculateScore()
	}

	_drawGrid() {
		const gridY = Math.max(5, Math.round(this._displayHeight / GRAPH_REFERENCE.height) * 5)
		const gridX = Math.max(10, Math.round(this._displayWidth / GRAPH_REFERENCE.width) * 10)

		for (let y = 0; y <= this._displayHeight; y += gridY) {
			this.context.beginPath()
			this.context.moveTo(0, y)
			this.context.lineTo(this._displayWidth, y)
			this.context.strokeStyle = '#EEEEEE'
			this.context.lineWidth = 1
			this.context.stroke()
		}

		for (let x = 0; x <= this._displayWidth; x += gridX) {
			this.context.beginPath()
			this.context.moveTo(x, 0)
			this.context.lineTo(x, this._displayHeight)
			this.context.strokeStyle = '#EEEEEE'
			this.context.stroke()
		}
	}

	_drawUserGraph() {
		if (this.userGraph.length > 1) {
			for (let i = 1; i < this.userGraph.length; i++) {
				const prev = this.userGraph[i - 1]
				const curr = this.userGraph[i]

				this.context.beginPath()
				this.context.moveTo(prev.x, prev.y)
				this.context.lineTo(curr.x, curr.y)
				this.context.strokeStyle = curr.y < prev.y ? 'green' : 'red' // Red if going down, green if up
				this.context.stroke()
			}
		}
	}

	// _calculateScore() {
	//     const maxSamplePoints = 50;  // Number of points to compare (fewer points for better performance)
	//     const userGraphLength = Math.min(this.userGraph.length, this.originalGraph.length);  // Use the shorter graph
	//     const step = Math.max(1, Math.floor(userGraphLength / maxSamplePoints));  // Ensure we don’t step too fast

	//     let totalDifference = 0;
	//     let pointsCompared = 0;

	//     // Sample fewer points to avoid too many comparisons
	//     for (let i = 0; i < userGraphLength; i += step) {
	//         const originalPoint = this.originalGraph[i];
	//         const userPoint = this.userGraph[i];

	//         if (originalPoint && userPoint) {
	//             const distance = Math.abs(originalPoint.y - userPoint.y);  // Only compare Y values
	//             totalDifference += distance;
	//             pointsCompared++;
	//         }

	//         // If the total difference is getting too high early, we can stop
	//         if (totalDifference > 10000) {  // Example threshold, adjust as needed
	//             break;
	//         }
	//     }

	//     // Prevent division by zero and ensure maxDifference is correctly calculated
	//     const maxDifference = this._displayHeight * pointsCompared;
	//     const accuracy = Math.max(0, (1 - totalDifference / maxDifference)) * 100;

	//     // Display score
	//     this._scoreNumber.innerHTML = `${accuracy.toFixed(2)}%`;
	//     this._scoreNumber.style.backgroundColor = accuracy > 50 ? 'green' : 'red';
	// }

	_calculateScore() {
		// Update the score display
		this._scoreNumber.innerHTML = `${this.graphScore.toFixed(0)}%`
		this._scoreNumber.style.backgroundColor = this.graphScore >= 0 ? 'green' : 'red'
	}

	// on event joystick up set up boolean to false
	// then on update if event push up or down on graph then
	_bindEvents() {
		addEventListener('keydown', this._handleKeyDown)
		addEventListener('keyup', this._handleKeyUp)

		this._joystickInterval = window.setInterval(() => {
			if (!this.isGameActive) return
			const step = this._verticalStep ?? 5
			if (this._joystickBottom) {
				this.currentY = Math.max(0, this.currentY + step) // Move up
				if (this.graphScore > 0) this.graphScore = 0
				this.graphScore -= 1
				this._calculateScore() // Update score for ArrowUp

				this.currentX += this.drawingSpeed // Move horizontally at a constant speed
				this.userGraph.push({ x: this.currentX, y: this.currentY })
			} else if (this._joystickTop) {
				this.currentY = Math.min(this._displayHeight, this.currentY - step)
				if (this.graphScore < 0) this.graphScore = 0
				this.graphScore += 1
				this._calculateScore() // Update score for ArrowUp

				this.currentX += this.drawingSpeed // Move horizontally at a constant speed
				this.userGraph.push({ x: this.currentX, y: this.currentY })
			}

			if (this.currentX >= this._displayWidth) {
				this.isGameActive = false

				this.end()
			}
		}, 100)
	}

	_handleKeyDown = (e) => {
		if (e.key === 'ArrowUp') {
			this._joystickTop = true
		} else if (e.key === 'ArrowDown') {
			this._joystickBottom = true
		}
	}

	_handleKeyUp = (e) => {
		if (e.key === 'ArrowUp') {
			this._joystickTop = false
		} else if (e.key === 'ArrowDown') {
			this._joystickBottom = false
		}
	}
}
