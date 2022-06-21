class ChallengeTrackerSettings {
  static id = 'challenge-tracker'
  static templates = {
    challengeTracker: `modules/${this.id}/templates/challenge-tracker.hbs`
  }

  static title = 'Challenge Tracker'
}

class ChallengeTracker extends Application {
  constructor (totalSuccess, totalFailure, currentSuccess = 0, currentFailure = 0, challengeTrackerOptions = {show: false}) {
    super()
    this._disable_popout_module = true // Disable the PopOut! module on this application
    this.totalSuccess = totalSuccess
    this.totalFailure = totalFailure
    this.currentSuccess = currentSuccess
    this.currentFailure = currentFailure
    this.challengeTrackerOptions = challengeTrackerOptions
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

  static open (totalSuccess, totalFailure, challengeTrackerOptions = { show: false }) {
    if (!game.user.isGM) return
    const currentSuccess = 0
    const currentFailure = 0
    challengeTrackerOptions["show"] = [true, false].includes(challengeTrackerOptions.show) ? challengeTrackerOptions.show : false
    if (challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'openHandler',
        totalSuccess,
        totalFailure,
        currentSuccess,
        currentFailure,
        challengeTrackerOptions
      )
    } else {
      ChallengeTracker.openHandler(
        totalSuccess,
        totalFailure,
        currentSuccess,
        currentFailure,
        challengeTrackerOptions
      )
    }
  }

  static openHandler (totalSuccess, totalFailure, currentSuccess = 0, currentFailure = 0, challengeTrackerOptions = { show: false }) {
    if (!game.challengeTracker) {
      game.challengeTracker = new ChallengeTracker(
        totalSuccess,
        totalFailure,
        currentSuccess,
        currentFailure,
        challengeTrackerOptions
      )
    } else {
      this.totalSuccess = totalSuccess
      this.totalFailure = totalFailure
      this.currentSuccess = currentSuccess
      this.currentFailure = currentFailure
      this.challengeTrackerOptions = challengeTrackerOptions
    }
    if (!game.challengeTracker.rendered) game.challengeTracker.render(true)
  }

  close () {
    if (game.user.isGM) this.eventListenerController.abort()
    if (game.challengeTracker) {
      super.close()
      delete game.challengeTracker
    }
  }

  static closeHandler () {
    game.challengeTracker?.close()
  }

  getData (options) {
    return {}
  }

  // Methods for event listeners

  activateListeners (html) {
    super.activateListeners(html)
    if (game.user.isGM) {
      this.updateCloseElement(game.settings.get('challenge-tracker', 'size'))
      this.element.find('.close').before('<a class="show-hide"></a>')
      this.showHide(this.challengeTrackerOptions.show)
    }
    if (!game.user.isGM) this.element.find('.header-button.close').remove() // Remove the Close button for players
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
      this.updateScroll(game.settings.get('challenge-tracker', 'scroll'))
    }
  }

  challengeTrackerMouseMoveEvent (event) {
    this.mousePosition.x = event.pageX
    this.mousePosition.y = event.pageY
  }

  challengeTrackerClickEvent (event) {
    if (this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      this.currentFailure = (this.currentFailure === this.totalFailure) ? this.totalFailure : this.currentFailure + 1
      this.draw(
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      this.currentSuccess = (this.currentSuccess === this.totalSuccess) ? this.totalSuccess : this.currentSuccess + 1
      this.draw(
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
      this.draw(
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.currentSuccess = (this.currentSuccess === 0) ? this.totalSuccess : this.currentSuccess - 1
      this.draw(
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
        this.draw(
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure
        )
      }
      if (event.code === 'Equal') {
        this.totalFailure++
        this.draw(
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
        this.draw(
          this.totalSuccess,
          this.totalFailure,
          this.currentSuccess,
          this.currentFailure
        )
      }
      if (event.code === 'Equal') {
        this.totalSuccess++
        this.draw(
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
      this.draw(
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
      this.draw(
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }

  // Methods for drawing the Challenge Tracker

  draw (totalSuccess, totalFailure, currentSuccess, currentFailure) {
    if (this.challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'drawHandler',
        totalSuccess,
        totalFailure,
        currentSuccess,
        currentFailure
      )
    } else {
      ChallengeTracker.drawHandler(totalSuccess, totalFailure, currentSuccess, currentFailure)
    }
  }

  static drawHandler (totalSuccess, totalFailure, currentSuccess, currentFailure) {
    game.challengeTracker.drawCanvas(totalSuccess, totalFailure, currentSuccess, currentFailure)
  }

  drawCanvas (totalSuccess, totalFailure, currentSuccess, currentFailure) {
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

  // Methods for setting updates

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
      this.draw(
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure
      )
    }
  }

  updateScroll (scroll = game.settings.get('challenge-tracker', 'scroll')) {
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

  updateSize (size) {
    this.updateShowHideElement({ size, show: this.challengeTrackerOptions.show })
    this.updateCloseElement(size)
    this.showHideEvent()
    this.draw(
      this.totalSuccess,
      this.totalFailure,
      this.currentSuccess,
      this.currentFailure
    )
  }

  updateCloseElement (size) {
    const closeElement = this.element.find('.header-button.close')
    if (size <= 200) {
      closeElement.html('<i class="fas fa-times"></i>')
    } else {
      closeElement.html('<i class="fas fa-times"></i>Close')
    }
  }

  // Methods for showing or hiding the Challenge Tracker for players

  updateShowHideElement ({ size = game.settings.get('challenge-tracker', 'size'), show = this.challengeTrackerOptions.show }) {
    const showHideElement = this.element.find('.show-hide')
    let showHideHtmlText
    let showHideHtmlIcon
    if (show) {
      showHideHtmlText = 'Hide'
      showHideHtmlIcon = 'fas fa-eye-slash fa-fw'
    } else {
      showHideHtmlText = 'Show'
      showHideHtmlIcon = 'fas fa-eye fa-fw'
    }
    if (size < 300) showHideHtmlText = ''
    const showHideHtml = `<a class="show-hide"><i class="${showHideHtmlIcon}"></i>${showHideHtmlText}</a>`
    showHideElement.replaceWith(showHideHtml)
  }

  showHide (show = this.challengeTrackerOptions.show) {
    this.updateShowHideElement(show)
    if (show) {
      ChallengeTrackerSocket.executeForOthers(
        'openHandler',
        this.totalSuccess,
        this.totalFailure,
        this.currentSuccess,
        this.currentFailure,
        show
      )
    } else {
      ChallengeTrackerSocket.executeForOthers('closeHandler')
    }
    this.showHideEvent()
  }

  switchShowHide () {
    this.challengeTrackerOptions.show = !(this.challengeTrackerOptions.show)
    this.showHide(this.challengeTrackerOptions.show)
  }

  showHideEvent () {
    this.element.find('.show-hide').one('click', () => this.switchShowHide())
  }

  static show () {
    if (!game.user.isGM) return
    if (game.challengeTracker) game.challengeTracker.showHandler()
  }

  showHandler () {
    this.challengeTrackerOptions.show = true
    this.showHide(this.challengeTrackerOptions.show)
  }

  static hide () {
    if (!game.user.isGM) return
    if (game.challengeTracker) game.challengeTracker.hideHandler()
  }

  hideHandler () {
    this.challengeTrackerOptions.show = false
    this.showHide(this.challengeTrackerOptions.show)
  }
}
