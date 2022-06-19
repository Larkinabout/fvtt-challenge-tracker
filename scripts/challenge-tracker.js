class ChallengeTrackerSettings {
  static id = 'challenge-tracker'
  static templates = {
    challengeTracker: `modules/${this.id}/templates/challenge-tracker.hbs`
  }

  static title = 'Challenge Tracker'
}

class ChallengeTracker extends Application {
  constructor (totalSuccess, totalFailure) {
    super()
    this._disable_popout_module = true // Disable the PopOut! module on this application
    this.totalSuccess = totalSuccess
    this.totalFailure = totalFailure
    this.currentSuccess = 0
    this.currentFailure = 0
    this.successColor = null
    this.failureColor = null
    this.frameColor = null
    this.successColorShade = null
    this.failureColorShade = null
    this.successColorBackground = null
    this.failureColorBackground = null
    this.updateColor(
      game.settings.get('challenge-tracker', 'successColor'),
      game.settings.get('challenge-tracker', 'failureColor'),
      game.settings.get('challenge-tracker', 'frameColor')
    )
    this.canvasFrame = undefined
    this.contextFrame = undefined
    this.innerArc = new Path2D()
    this.outerArc = new Path2D()
    this.mousePosition = { x: 0, y: 0 }
    this.eventListenerController = new AbortController()
    this.eventListenerSignal = this.eventListenerController.signal
    this.eventListenerControllerScroll = null
    this.eventListenerSignalScroll = null
  }

  static get defaultOptions () {
    return {
      ...super.defaultOptions,
      id: ChallengeTrackerSettings.id,
      template: ChallengeTrackerSettings.templates.challengeTracker,
      title: ChallengeTrackerSettings.title,
      resizable: false
    }
  }

  static open (totalSuccess, totalFailure) {
    if (game.user.isGM) ChallengeTrackerSocket.executeForEveryone('openForEveryone', totalSuccess, totalFailure)
  }

  static openForEveryone (totalSuccess, totalFailure) {
    ChallengeTracker.initialise(totalSuccess, totalFailure)
  }

  static initialise (totalSuccess, totalFailure) {
    if (!game.challengeTracker) {
      game.challengeTracker = new ChallengeTracker(totalSuccess, totalFailure)
    } else {
      this.totalSuccess = totalSuccess
      this.totalFailure = totalFailure
      this.currentSuccess = 0
      this.currentFailure = 0
    }
    if (!game.challengeTracker.rendered) game.challengeTracker.render(true)
  }

  getData (options) {
    return {}
  }

  activateListeners (html) {
    super.activateListeners(html)
    if (!game.user.isGM) this.element.find('.header-button').remove() // Remove the Close button for players
  }

  activateListenersPostDraw () {
    // Add event listeners for GM
    if (game.user.isGM) {
      this.eventListenerController = new AbortController()
      this.eventListenerSignal = this.eventListenerController.signal
      document.addEventListener('mousemove', (event) => this.challengeTrackerMouseMoveEvent(event),
        { signal: this.eventListenerSignal }
      )
      document.addEventListener('keypress', (event) => this.challengeTrackerKeyPressEvent(event),
        { signal: this.eventListenerSignal }
      )
      this.canvasFrame.addEventListener('click', (event) => this.challengeTrackerClickEvent(event),
        { signal: this.eventListenerSignal }
      )
      this.canvasFrame.addEventListener('contextmenu', (event) => this.challengeTrackerContextMenuEvent(event),
        { signal: this.eventListenerSignal }
      )
      this.updateScroll()
    }
  }

  challengeTrackerMouseMoveEvent (event) {
    this.mousePosition.x = event.pageX
    this.mousePosition.y = event.pageY
  }

  challengeTrackerClickEvent (event) {
    if (this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      this.currentFailure = (this.currentFailure === this.totalFailure) ? this.totalFailure : this.currentFailure + 1
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      this.currentSuccess = (this.currentSuccess === this.totalSuccess) ? this.totalSuccess : this.currentSuccess + 1
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }

  challengeTrackerContextMenuEvent (event) {
    if (this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.currentFailure = (this.currentFailure === 0) ? this.totalFailure : this.currentFailure - 1
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.currentSuccess = (this.currentSuccess === 0) ? this.totalSuccess : this.currentSuccess - 1
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }

  challengeTrackerKeyPressEvent (event) {
    const rect = this.canvasFrame.getBoundingClientRect()
    const x = this.mousePosition.x - rect.left
    const y = this.mousePosition.y - rect.top
    if (this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.totalFailure > 1) this.totalFailure--
        this.currentFailure = (this.currentFailure > this.totalFailure) ? this.totalFailure : this.currentFailure
        ChallengeTrackerSocket.executeForEveryone(
          'drawForEveryone',
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure)
      }
      if (event.code === 'Equal') {
        this.totalFailure++
        ChallengeTrackerSocket.executeForEveryone(
          'drawForEveryone',
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure
        )
      }
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.totalSuccess > 1) this.totalSuccess--
        ChallengeTrackerSocket.executeForEveryone(
          'drawForEveryone',
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure
        )
      }
      if (event.code === 'Equal') {
        this.totalSuccess++
        ChallengeTrackerSocket.executeForEveryone(
          'drawForEveryone',
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure
        )
      }
    }
  }

  challengeTrackerWheelEvent (event) {
    const rect = this.canvasFrame.getBoundingClientRect()
    const x = this.mousePosition.x - rect.left
    const y = this.mousePosition.y - rect.top
    if (this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.totalFailure > 1) this.totalFailure--
        this.currentFailure = (this.currentFailure > this.totalFailure) ? this.totalFailure : this.currentFailure
      }
      if (event.deltaY < 0) {
        this.totalFailure++
      }
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.totalSuccess > 1) this.totalSuccess--
        this.currentSuccess = (this.currentSuccess > this.totalSuccess) ? this.totalSuccess : this.currentSuccess
      }
      if (event.deltaY < 0) {
        this.totalSuccess++
      }
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }

  static drawForEveryone (totalSuccess, totalFailure, currentSuccess, currentFailure) {
    if (!game.challengeTracker.rendered) {
      ChallengeTracker.initialise(totalSuccess, totalFailure)
    } else {
      game.challengeTracker?.draw(totalSuccess, totalFailure, currentSuccess, currentFailure)
    }
  }

  draw (totalSuccess, totalFailure, currentSuccess, currentFailure) {
    // Set variables
    this.totalSuccess = totalSuccess
    this.totalFailure = totalFailure
    this.currentSuccess = currentSuccess
    this.currentFailure = currentFailure
    const canvasSize = game.settings.get('challenge-tracker', 'size')
    const halfCanvasSize = canvasSize / 2
    const lineWidth = Math.round(canvasSize / 25)
    const halfLineWidth = lineWidth / 2
    const radius = halfCanvasSize - lineWidth
    this.position.width = canvasSize
    this.position.height = 'auto'

    const windowApp = document.getElementById('challenge-tracker')
    const wrapper = document.getElementById('challenge-tracker-wrapper')
    this.canvasFrame = document.getElementById('challenge-tracker-canvas-frame')
    this.contextFrame = this.canvasFrame.getContext('2d')
    const canvas = document.getElementById('challenge-tracker-canvas')
    const context = canvas.getContext('2d')

    windowApp.style.width = 'auto'
    windowApp.style.height = 'auto'
    wrapper.style.width = canvasSize + 'px'
    wrapper.style.height = canvasSize + 'px'
    this.canvasFrame.setAttribute('height', canvasSize)
    this.canvasFrame.setAttribute('width', canvasSize)
    canvas.setAttribute('height', canvasSize)
    canvas.setAttribute('width', canvasSize)

    this.innerArc = new Path2D()
    this.outerArc = new Path2D()

    const successSliceRadians = (360 / this.totalSuccess) * Math.PI / 180
    const failureSliceRadians = (360 / this.totalFailure) * Math.PI / 180
    const startAngle = 1.5 * Math.PI
    const endAngleSuccess = (successSliceRadians * this.currentSuccess) + 1.5 * Math.PI
    const endAngleFailure = (failureSliceRadians * this.currentFailure) + 1.5 * Math.PI

    // Clear drawing on canvas element
    context.clearRect(0, 0, canvasSize, canvasSize)

    // SUCCESS

    // Draw background
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    context.arc(halfCanvasSize, halfCanvasSize, radius, 0, 2 * Math.PI)
    context.fillStyle = this.successColorBackground
    context.fill()
    context.closePath()
    // Set gradient
    const successGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3,
      halfCanvasSize,
      halfCanvasSize,
      radius
    )
    successGradient.addColorStop(0, this.successColor)
    successGradient.addColorStop(1, this.successColorShade)
    // Draw current success arc
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    if (this.currentSuccess > 0) context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, endAngleSuccess)
    context.fillStyle = successGradient
    context.fill()
    context.closePath()
    // Remove inner portion
    context.save()
    context.beginPath()
    context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
    context.globalCompositeOperation = 'destination-out'
    context.fillStyle = 'rgba(0, 0, 0, 1)'
    context.fill()
    context.closePath()
    context.restore()

    // FAILURE

    // Draw background
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
    context.fillStyle = this.failureColorBackground
    context.fill()
    context.closePath()
    // Set gradient
    const failureGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      0,
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3
    )
    failureGradient.addColorStop(0, this.failureColor)
    failureGradient.addColorStop(1, this.failureColorShade)
    // Draw current failure arc
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    if (this.currentFailure > 0) {
      context.arc(
        halfCanvasSize,
        halfCanvasSize,
        radius / 3 * 2 - lineWidth,
        startAngle,
        endAngleFailure
      )
    }
    context.fillStyle = failureGradient
    context.fill()
    context.closePath()

    // Clear drawing on canvasFrame element
    this.contextFrame.clearRect(0, 0, canvasSize, canvasSize)
    // Start drawing lines
    this.contextFrame.beginPath()
    this.contextFrame.shadowOffsetX = 1
    this.contextFrame.shadowOffsetY = 1
    this.contextFrame.shadowColor = 'rgba(0, 0, 0, 0.25)'
    this.contextFrame.shadowBlur = halfLineWidth
    // Draw lines between segments of success arc
    this.contextFrame.save()
    this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
    this.contextFrame.rotate(successSliceRadians * this.totalSuccess / 2)
    if (this.totalSuccess > 1) {
      for (let successSlice = 1; successSlice <= this.totalSuccess; successSlice++) {
        if (successSlice > 1) this.contextFrame.rotate(successSliceRadians)
        this.contextFrame.moveTo(0, radius / 5 * 3)
        this.contextFrame.lineTo(0, radius)
      }
    }
    this.contextFrame.restore()
    // Draw lines between segments of failure arc
    this.contextFrame.save()
    this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
    this.contextFrame.rotate(failureSliceRadians * this.totalFailure / 2)
    if (this.totalFailure > 1) {
      for (let failureSlice = 1; failureSlice <= this.totalFailure; failureSlice++) {
        if (failureSlice > 1) this.contextFrame.rotate(failureSliceRadians)
        this.contextFrame.moveTo(0, 0)
        this.contextFrame.lineTo(0, radius / 5 * 3)
      }
    }
    this.contextFrame.restore()
    // Stroke lines
    this.contextFrame.strokeStyle = this.frameColor
    this.contextFrame.lineWidth = halfLineWidth
    this.contextFrame.stroke()
    this.contextFrame.closePath()
    // Draw circles
    this.contextFrame.beginPath()
    this.outerArc.arc(halfCanvasSize, halfCanvasSize, radius, 0, 2 * Math.PI)
    this.innerArc.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
    this.contextFrame.strokeStyle = this.frameColor
    this.contextFrame.lineWidth = lineWidth
    this.contextFrame.stroke(this.outerArc)
    this.contextFrame.stroke(this.innerArc)
    this.contextFrame.closePath()
    // Draw thin circle around outer circle
    this.contextFrame.beginPath()
    this.contextFrame.arc(halfCanvasSize, halfCanvasSize, radius + halfLineWidth, 0, 2 * Math.PI)
    this.contextFrame.strokeStyle = 'rgba(50, 50, 50, 1)'
    this.contextFrame.lineWidth = 0.5
    this.contextFrame.stroke()
    this.contextFrame.closePath()
  }

  static closeForEveryone () {
    if (game.challengeTracker) game.challengeTracker.close()
  }

  close () {
    if (game.user.isGM) this.eventListenerController.abort()
    if (game.challengeTracker) {
      super.close()
      delete game.challengeTracker
    }
  }

  updateScroll () {
    const scroll = game.settings.get('challenge-tracker', 'scroll')
    if (game.challengeTracker) {
      if (scroll) {
        if (this.eventListenerSignalScroll == null || this.eventListenerSignalScroll.aborted) {
          this.eventListenerControllerScroll = new AbortController()
          this.eventListenerSignalScroll = this.eventListenerControllerScroll.signal
          document.addEventListener('wheel', (event) => this.challengeTrackerWheelEvent(event),
            { signal: this.eventListenerSignalScroll }
          )
        }
      } else {
        if (this.eventListenerSignalScroll !== null && !this.eventListenerSignalScroll.aborted) {
          this.eventListenerControllerScroll.abort()
        }
      }
    }
  }

  updateColor (successColor, failureColor, frameColor) {
    this.successColor = successColor
    this.failureColor = failureColor
    this.frameColor = frameColor
    this.successColorShade = ShadeColor.shadeColor(successColor, 1.25)
    this.failureColorShade = ShadeColor.shadeColor(failureColor, 1.25)
    this.successColorBackground = this.successColorShade.substring(0, 7) + '2b'
    this.failureColorBackground = this.failureColorShade.substring(0, 7) + '2b'
  }

  updateColorAndDraw (successColor, failureColor, frameColor) {
    this.updateColor(successColor, failureColor, frameColor)
    if (game.challengeTracker?.rendered) {
      ChallengeTrackerSocket.executeForEveryone(
        'drawForEveryone',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }
}
