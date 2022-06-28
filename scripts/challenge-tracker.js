class ChallengeTrackerSettings {
  static id = 'challenge-tracker'
  static templates = {
    challengeTracker: 'modules/challenge-tracker/templates/challenge-tracker.hbs'
  }

  static title = 'Challenge Tracker'
}

class ChallengeTracker extends Application {
  constructor (
    outerTotal,
    innerTotal,
    challengeTrackerOptions = {
      show: false,
      outerCurrent: 0,
      innerCurrent: 0,
      outerColor: null,
      innerColor: null,
      frameColor: null,
      size: null,
      title: ChallengeTrackerSettings.title
    },
    options
  ) {
    super(options)
    this._disable_popout_module = true // Disable the PopOut! module on this application
    this.outerTotal = outerTotal
    this.innerTotal = innerTotal

    // Challenge Tracker Options
    this.challengeTrackerOptions = challengeTrackerOptions
    this.challengeTrackerOptions.show = [true, false].includes(challengeTrackerOptions.show)
      ? challengeTrackerOptions.show
      : false
    this.challengeTrackerOptions.outerCurrent = challengeTrackerOptions.outerCurrent ?? 0
    this.challengeTrackerOptions.innerCurrent = challengeTrackerOptions.innerCurrent ?? 0
    this.challengeTrackerOptions.outerColor = challengeTrackerOptions.outerColor ?? null
    this.challengeTrackerOptions.innerColor = challengeTrackerOptions.innerColor ?? null
    this.challengeTrackerOptions.frameColor = challengeTrackerOptions.frameColor ?? null
    this.challengeTrackerOptions.size = challengeTrackerOptions.size ?? null

    // Colors
    this.outerColor = this.challengeTrackerOptions.outerColor ??
      game.settings.get('challenge-tracker', 'outerColor')
    this.innerColor = this.challengeTrackerOptions.innerColor ??
      game.settings.get('challenge-tracker', 'innerColor')
    this.frameColor = this.challengeTrackerOptions.frameColor ??
      game.settings.get('challenge-tracker', 'frameColor')
    this.size = this.challengeTrackerOptions.size ??
      game.settings.get('challenge-tracker', 'size')
    this.outerColorShade = null
    this.innerColorShade = null
    this.outerColorBackground = null
    this.innerColorBackground = null
    this.updateColor(this.outerColor, this.innerColor, this.frameColor)

    // Canvas
    this.canvasFrame = undefined
    this.contextFrame = undefined
    this.innerArc = new Path2D()
    this.outerArc = new Path2D()

    // Events
    this.mousePosition = { x: 0, y: 0 }
    this.eventListenerController = new AbortController()
    this.eventListenerSignal = this.eventListenerController.signal
    this.eventListenerControllerScroll = null
    this.eventListenerSignalScroll = null
  }

  /* Set default options for application */
  static get defaultOptions () {
    return {
      ...super.defaultOptions,
      template: ChallengeTrackerSettings.templates.challengeTracker,
      resizable: false
    }
  }

  /**
  * Open Challenge Tracker
  * @param {number} outerTotal Number of segments for the outer ring
  * @param {number} innerTotal Number of segments for the inner circle
  * @param {array} [challengeTrackerOptions] show, outerCurrent, innerCurrent, outerColor, innerColor, frameColor, size, title
  **/
  static open (outerTotal, innerTotal,
    challengeTrackerOptions = {
      show: false,
      outerCurrent: 0,
      innerCurrent: 0,
      outerColor: null,
      innerColor: null,
      frameColor: null,
      size: null,
      title: ChallengeTrackerSettings.title
    }
  ) {
    // Only allow GM to execute
    if (!game.user.isGM) return

    // Set defaults
    challengeTrackerOptions.show = [true, false].includes(challengeTrackerOptions.show)
      ? challengeTrackerOptions.show
      : false
    challengeTrackerOptions.title = challengeTrackerOptions.title ?? ChallengeTrackerSettings.title

    // Set unique id for each Challenge Tracker
    const id = `${ChallengeTrackerSettings.id}-${Math.random().toString(16).slice(2)}`

    // Call openHandler for only GM or everyone
    if (challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'openHandler',
        outerTotal,
        innerTotal,
        challengeTrackerOptions,
        { id, title: challengeTrackerOptions.title }
      )
    } else {
      ChallengeTracker.openHandler(
        outerTotal,
        innerTotal,
        challengeTrackerOptions,
        { id, title: challengeTrackerOptions.title }
      )
    }
  }

  /**
  * Open Challenge Tracker by id or open a new Challenge Tracker
  * @param {number} outerTotal Number of segments for the outer ring
  * @param {number} innerTotal Number of segments for the inner circle
  * @param {array} challengeTrackerOptions show, outerCurrent, innerCurrent, outerColor, innerColor, frameColor, size, title
  * @param {array} options id, template, title
  **/
  static openHandler (outerTotal, innerTotal, challengeTrackerOptions, options) {
    // If array does not exist, create an empty array
    if (!game.challengeTracker) game.challengeTracker = []

    // Find index by id, otherwise use next available index
    let index
    const element = game.challengeTracker.find(element => element.id === options.id)
    if (element) {
      index = game.challengeTracker.indexOf(element)
    } else {
      index = game.challengeTracker.length
    }

    // Add new Challenge Tracker or update client variables
    if (!game.challengeTracker[index]) {
      game.challengeTracker[index] = new ChallengeTracker(
        outerTotal,
        innerTotal,
        challengeTrackerOptions,
        options
      )
    } else {
      this.outerTotal = outerTotal
      this.innerTotal = innerTotal
      this.challengeTrackerOptions = challengeTrackerOptions
    }

    // Render the Challenge Tracker
    if (!game.challengeTracker[index].rendered) game.challengeTracker[index].render(true)
  }

  /* Close Challenge Tracker */
  close_ () {
    if (game.user.isGM) this.eventListenerController.abort()
    ChallengeTrackerSocket.executeForEveryone(
      'closeHandler',
      this.options
    )
  }

  /**
  * Close the Challenge Tracker by Id
  * @param {array} options id, template, title
  **/
  static closeHandler (options) {
    const element = game.challengeTracker.find(element => element.id === options.id)
    if (!element) return
    const index = game.challengeTracker.indexOf(element)
    element.close()
    game.challengeTracker.splice(index, 1)
  }

  getData (options) {
    return {}
  }

  /* Update HTML elements post render */
  activateListeners (html) {
    super.activateListeners(html)

    // Add class to handle CSS across all Challenge Trackers
    this.element.addClass('challenge-tracker')

    // Update elements on window header
    if (game.user.isGM) {
      this.updateCloseElement(game.settings.get('challenge-tracker', 'size'))
      this.element.find('.close').before('<a class="show-hide"></a>')
      this.showHide(this.challengeTrackerOptions.show)
    }

    // Remove the Close button for players
    if (!game.user.isGM) this.element.find('.header-button.close').remove()
  }

  /* Add event listeners for GM */
  activateListenersPostDraw () {
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
      if (game.settings.get('challenge-tracker', 'scroll')) {
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

  /**
  * Set mouse position on mouse move event
  * @param {object} event Listener event
  **/
  challengeTrackerMouseMoveEvent (event) {
    this.mousePosition.x = event.pageX
    this.mousePosition.y = event.pageY
  }

  /**
  * Increase current segments on mouse left-click
  * @param {object} event Listener event
  **/
  challengeTrackerClickEvent (event) {
    if (this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent === this.innerTotal)
        ? this.innerTotal
        : this.challengeTrackerOptions.innerCurrent + 1
      this.draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent === this.outerTotal)
        ? this.outerTotal
        : this.challengeTrackerOptions.outerCurrent + 1
      this.draw()
    }
  }

  /**
  * Decrease current segments on mouse right-click
  * @param {object} event Listener event
  **/
  challengeTrackerContextMenuEvent (event) {
    if (this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent === 0)
        ? this.innerTotal
        : this.challengeTrackerOptions.innerCurrent - 1
      this.draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent === 0)
        ? this.outerTotal
        : this.challengeTrackerOptions.outerCurrent - 1
      this.draw()
    }
  }

  /**
  * Increase/decrease total segments on +/- key press
  * @param {object} event Listener event
  **/
  challengeTrackerKeyPressEvent (event) {
    const rect = this.canvasFrame.getBoundingClientRect()
    const x = this.mousePosition.x - rect.left
    const y = this.mousePosition.y - rect.top
    if (this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.innerTotal > 1) this.innerTotal--
        this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent > this.innerTotal)
          ? this.innerTotal
          : this.challengeTrackerOptions.innerCurrent
        this.draw()
      }
      if (event.code === 'Equal') {
        this.innerTotal++
        this.draw()
      }
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.outerTotal > 1) this.outerTotal--
        this.draw()
      }
      if (event.code === 'Equal') {
        this.outerTotal++
        this.draw()
      }
    }
  }

  /**
  * Increase/decrease total segments on scroll
  * @param {object} event Listener event
  **/
  challengeTrackerWheelEvent (event) {
    const rect = this.canvasFrame.getBoundingClientRect()
    const x = this.mousePosition.x - rect.left
    const y = this.mousePosition.y - rect.top
    if (this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.innerTotal > 1) this.innerTotal--
        this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent > this.innerTotal)
          ? this.innerTotal
          : this.challengeTrackerOptions.innerCurrent
      }
      if (event.deltaY < 0) {
        this.innerTotal++
      }
      this.draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.outerTotal > 1) this.outerTotal--
        this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent > this.outerTotal)
          ? this.outerTotal
          : this.challengeTrackerOptions.outerCurrent
      }
      if (event.deltaY < 0) {
        this.outerTotal++
      }
      this.draw()
    }
  }

  /* Draw the Challenge Tracker */
  draw () {
    // Call drawHandler for GM only or everyone
    if (this.challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'drawHandler',
        this.outerTotal,
        this.innerTotal,
        this.challengeTrackerOptions,
        this.options
      )
    } else {
      ChallengeTracker.drawHandler(
        this.outerTotal,
        this.innerTotal,
        this.challengeTrackerOptions,
        this.options
      )
    }
  }

  /**
  * Draw Challenge Tracker by Id
  * @param {number} outerTotal Number of segments for the outer ring
  * @param {number} innerTotal Number of segments for the inner circle
  * @param {array} challengeTrackerOptions show, outerCurrent, innerCurrent, outerColor, innerColor, frameColor, size, title
  * @param {array} options id, template, title
  **/
  static drawHandler (outerTotal, innerTotal, challengeTrackerOptions, options) {
    const element = game.challengeTracker.find(element => element.id === options.id)
    if (!element) return
    element.drawCanvas(outerTotal, innerTotal, challengeTrackerOptions)
  }

  /**
  * Draw the Challenge Tracker canvas
  * @param {number} outerTotal Number of segments for the outer ring
  * @param {number} innerTotal Number of segments for the inner circle
  * @param {array} challengeTrackerOptions show, outerCurrent, innerCurrent, outerColor, innerColor, frameColor, size, title
  **/
  drawCanvas (outerTotal, innerTotal, challengeTrackerOptions) {
    // Set variables
    this.outerTotal = outerTotal
    this.innerTotal = innerTotal
    this.challengeTrackerOptions = challengeTrackerOptions
    const canvasSize = this.size
    const halfCanvasSize = canvasSize / 2
    const lineWidth = Math.round(canvasSize / 25)
    const halfLineWidth = lineWidth / 2
    const radius = halfCanvasSize - lineWidth
    this.position.width = canvasSize
    this.position.height = 'auto'

    const windowApp = this.element[0]
    const wrapper = this.element.find('#challenge-tracker-wrapper')[0]
    this.canvasFrame = this.element.find('#challenge-tracker-canvas-frame')[0]
    this.contextFrame = this.canvasFrame.getContext('2d')
    const canvas = this.element.find('#challenge-tracker-canvas')[0]
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

    const outerSliceRadians = (360 / this.outerTotal) * Math.PI / 180
    const innerSliceRadians = (360 / this.innerTotal) * Math.PI / 180
    const startAngle = 1.5 * Math.PI
    const outerEndAngle = (outerSliceRadians * this.challengeTrackerOptions.outerCurrent) + 1.5 * Math.PI
    const innerEndAngle = (innerSliceRadians * this.challengeTrackerOptions.innerCurrent) + 1.5 * Math.PI

    // Clear drawing on canvas element
    context.clearRect(0, 0, canvasSize, canvasSize)

    // Draw outer ring background
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    context.arc(halfCanvasSize, halfCanvasSize, radius, 0, 2 * Math.PI)
    context.fillStyle = this.outerColorBackground
    context.fill()
    context.closePath()

    // Set outer ring gradient
    const outerGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3,
      halfCanvasSize,
      halfCanvasSize,
      radius
    )
    outerGradient.addColorStop(0, this.outerColor)
    outerGradient.addColorStop(1, this.outerColorShade)

    // Draw outer ring current arc
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    if (this.challengeTrackerOptions.outerCurrent > 0) context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle)
    context.fillStyle = outerGradient
    context.fill()
    context.closePath()

    // Remove centre of outer ring for the inner circle
    context.save()
    context.beginPath()
    context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
    context.globalCompositeOperation = 'destination-out'
    context.fillStyle = 'rgba(0, 0, 0, 1)'
    context.fill()
    context.closePath()
    context.restore()

    // Draw inner circle background
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
    context.fillStyle = this.innerColorBackground
    context.fill()
    context.closePath()

    // Set inner circle gradient
    const innerGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      0,
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3
    )
    innerGradient.addColorStop(0, this.innerColor)
    innerGradient.addColorStop(1, this.innerColorShade)

    // Draw inner circle current arc
    context.beginPath()
    context.moveTo(halfCanvasSize, halfCanvasSize)
    if (this.challengeTrackerOptions.innerCurrent > 0) {
      context.arc(
        halfCanvasSize,
        halfCanvasSize,
        radius / 3 * 2 - lineWidth,
        startAngle,
        innerEndAngle
      )
    }
    context.fillStyle = innerGradient
    context.fill()
    context.closePath()

    // Clear drawing on canvasFrame element
    this.contextFrame.clearRect(0, 0, canvasSize, canvasSize)

    // Draw frame
    this.contextFrame.beginPath()
    this.contextFrame.shadowOffsetX = 1
    this.contextFrame.shadowOffsetY = 1
    this.contextFrame.shadowColor = 'rgba(0, 0, 0, 0.25)'
    this.contextFrame.shadowBlur = halfLineWidth

    // Draw lines between segments of outer ring
    this.contextFrame.save()
    this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
    this.contextFrame.rotate(outerSliceRadians * this.outerTotal / 2)
    if (this.outerTotal > 1) {
      for (let outerSlice = 1; outerSlice <= this.outerTotal; outerSlice++) {
        if (outerSlice > 1) this.contextFrame.rotate(outerSliceRadians)
        this.contextFrame.moveTo(0, radius / 5 * 3)
        this.contextFrame.lineTo(0, radius)
      }
    }
    this.contextFrame.restore()

    // Draw lines between segments of inner circle
    this.contextFrame.save()
    this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
    this.contextFrame.rotate(innerSliceRadians * this.innerTotal / 2)
    if (this.innerTotal > 1) {
      for (let innerSlice = 1; innerSlice <= this.innerTotal; innerSlice++) {
        if (innerSlice > 1) this.contextFrame.rotate(innerSliceRadians)
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

    // Draw thin circle around outer ring
    this.contextFrame.beginPath()
    this.contextFrame.arc(halfCanvasSize, halfCanvasSize, radius + halfLineWidth, 0, 2 * Math.PI)
    this.contextFrame.strokeStyle = 'rgba(50, 50, 50, 1)'
    this.contextFrame.lineWidth = 0.5
    this.contextFrame.stroke()
    this.contextFrame.closePath()
  }

  /**
  * Set colors and draw all Challenge Trackers based on the module settings
  * @param {string} outerColor Hex color for the outer ring
  * @param {string} innerColor Hex color for the inner circle
  * @param {string} frameColor Hex color for the frame
  **/
  static updateColorAndDraw (outerColor, innerColor, frameColor) {
    if (!game.challengeTracker) return
    for (const element of game.challengeTracker) {
      element.updateColor(outerColor, innerColor, frameColor)
      element.draw()
    }
  }

  /**
  * Update colors on all Challenge Trackers based on options or the module settings
  * @param {string} outerColor Hex color for the outer ring
  * @param {string} innerColor Hex color for the inner circle
  * @param {string} frameColor Hex color for the frame
  **/
  updateColor (outerColor, innerColor, frameColor) {
    this.outerColor = this.challengeTrackerOptions.outerColor ?? outerColor
    this.innerColor = this.challengeTrackerOptions.innerColor ?? innerColor
    this.frameColor = this.challengeTrackerOptions.frameColor ?? frameColor
    this.outerColorShade = ShadeColor.shadeColor(this.outerColor, 1.25)
    this.innerColorShade = ShadeColor.shadeColor(this.innerColor, 1.25)
    this.outerColorBackground = this.outerColorShade.substring(0, 7) + '2b'
    this.innerColorBackground = this.innerColorShade.substring(0, 7) + '2b'
  }

  /**
  * Enable/disable scroll wheel event on all Challenge Trackers based on the module setting
  * @param {boolean} scroll Enable (true) or disable (false) the scroll wheel event
  **/
  static updateScroll (scroll) {
    if (!game.challengeTracker) return
    for (const element of game.challengeTracker) {
      if (scroll) {
        if (element.eventListenerSignalScroll == null || element.eventListenerSignalScroll.aborted) {
          element.eventListenerControllerScroll = new AbortController()
          element.eventListenerSignalScroll = element.eventListenerControllerScroll.signal
          document.addEventListener('wheel', (event) => element.challengeTrackerWheelEvent(event),
            { signal: element.eventListenerSignalScroll }
          )
        }
      } else {
        if (element.eventListenerSignalScroll !== null && !element.eventListenerSignalScroll.aborted) {
          element.eventListenerControllerScroll.abort()
        }
      }
    }
  }

  /**
  * Update size of all Challenge Trackers based on the module setting
  * @param {number} size Size of the Challenge Tracker in pixels
  **/
  static updateSize (size) {
    if (!game.challengeTracker) return
    for (const element of game.challengeTracker) {
      element.size = element.challengeTrackerOptions.size ?? size
      element.updateShowHideElement()
      element.updateCloseElement()
      element.showHideEvent()
      element.draw()
    }
  }

  /* Update the Close element on the window header */
  updateCloseElement () {
    const closeElement = this.element.find('.header-button.close')
    if (this.size <= 200) {
      closeElement.html('<i class="fas fa-times"></i>')
    } else {
      closeElement.html('<i class="fas fa-times"></i>Close')
    }
  }

  // Methods for showing or hiding the Challenge Tracker for players

  updateShowHideElement () {
    const showHideElement = this.element.find('.show-hide')
    let showHideHtmlText
    let showHideHtmlIcon
    if (this.challengeTrackerOptions.show) {
      showHideHtmlText = 'Hide'
      showHideHtmlIcon = 'fas fa-eye-slash fa-fw'
    } else {
      showHideHtmlText = 'Show'
      showHideHtmlIcon = 'fas fa-eye fa-fw'
    }
    if (this.size < 300) showHideHtmlText = ''
    const showHideHtml = `<a class="show-hide"><i class="${showHideHtmlIcon}"></i>${showHideHtmlText}</a>`
    showHideElement.replaceWith(showHideHtml)
  }

  showHide () {
    this.updateShowHideElement()
    if (this.challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForOthers(
        'openHandler',
        this.outerTotal,
        this.innerTotal,
        this.challengeTrackerOptions,
        this.options
      )
    } else {
      ChallengeTrackerSocket.executeForOthers(
        'closeHandler',
        this.options
      )
    }
    this.showHideEvent()
  }

  /* Switch the challengeTrackerOptions.show value */
  switchShowHide () {
    this.challengeTrackerOptions.show = !(this.challengeTrackerOptions.show)
    this.showHide()
  }

  /* Add click event to the show/hide element */
  showHideEvent () {
    this.element.find('.show-hide').one('click', () => this.switchShowHide())
  }

  /**
  * Show all Challenge Trackers or Challenge Tracker with matching title
  * @param {string} [title = null] Title of the Challenge Tracker
  **/
  static show (title = null) {
    // Only allow GM to execute
    if (!game.user.isGM) return
    if (!game.challengeTracker) return
    for (const element of game.challengeTracker) {
      if (element.options.title === title || title === null) {
        element.showHandler()
      }
    }
  }

  showHandler () {
    this.challengeTrackerOptions.show = true
    this.showHide()
  }

  /**
  * Hide all Challenge Trackers or Challenge Tracker with matching title
  * @param {string} [title = null] Title of the Challenge Tracker
  **/
  static hide (title = null) {
    // Only allow GM to execute
    if (!game.user.isGM) return
    if (!game.challengeTracker) return
    for (const element of game.challengeTracker) {
      if (element.options.title === title || title === null) {
        element.hideHandler()
      }
    }
  }

  hideHandler () {
    this.challengeTrackerOptions.show = false
    this.showHide()
  }
}
