import { Utils } from './utils.js'
import { ChallengeTrackerFlag } from './flags.js'

export class ChallengeTrackerSettings {
  static id = 'challenge-tracker'

  static schema = [
    'backgroundImage',
    'closeFunction',
    'frameColor',
    'frameWidth',
    'id',
    'foregroundImage',
    'innerBackgroundColor',
    'innerColor',
    'innerCurrent',
    'innerTotal',
    'listPosition',
    'openFunction',
    'outerBackgroundColor',
    'outerColor',
    'outerCurrent',
    'outerTotal',
    'ownerId',
    'persist',
    'show',
    'size',
    'title',
    'windowed'
  ]

  static default =
    {
      allowShow: 4,
      backgroundImage: null,
      buttonLocation: 'player-list',
      closeFunction: null,
      displayButton: 1,
      frameColor: '#0f1414',
      frameWidth: 'medium',
      id: null,
      foregroundImage: null,
      innerBackgroundColor: '#b0000066',
      innerColor: '#dc0000ff',
      innerCurrent: 0,
      innerTotal: 0,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: '#1b6f1b66',
      outerColor: '#228b22ff',
      outerCurrent: 0,
      outerTotal: 4,
      ownerId: null,
      persist: false,
      scroll: true,
      show: false,
      size: 400,
      title: game.i18n?.localize('challengeTracker.labels.challengeTrackerTitle'),
      windowed: false
    }

  static templates = {
    challengeTracker: 'modules/challenge-tracker/templates/challenge-tracker.hbs',
    challengeTrackerForm: 'modules/challenge-tracker/templates/challenge-tracker-form.hbs',
    challengeTrackerEditForm: 'modules/challenge-tracker/templates/challenge-tracker-edit-form.hbs'
  }
}

export class ChallengeTracker extends Application {
  constructor (
    challengeTrackerOptions = {
      backgroundImage: null,
      closeFunction: null,
      frameColor: null,
      frameWidth: null,
      id: null,
      foregroundImage: null,
      innerBackgroundColor: null,
      innerColor: null,
      innerCurrent: ChallengeTrackerSettings.default.innerCurrent,
      innerTotal: ChallengeTrackerSettings.default.innerTotal,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: null,
      outerColor: null,
      outerCurrent: ChallengeTrackerSettings.default.outerCurrent,
      outerTotal: ChallengeTrackerSettings.default.outerTotal,
      persist: ChallengeTrackerSettings.default.persist,
      show: ChallengeTrackerSettings.default.show,
      size: null,
      title: ChallengeTrackerSettings.title,
      windowed: null
    },
    options,
    ownerId = null,
    executorId = null
  ) {
    super(options)
    this.ownerId = ownerId
    this.executorId = executorId
    this._disable_popout_module = true // Disable the PopOut! module on this application

    // Challenge Tracker Options
    this.challengeTrackerOptions = challengeTrackerOptions
    this.challengeTrackerOptions.ownerId = ownerId
    this.challengeTrackerOptions.show = [true, false].includes(challengeTrackerOptions.show)
      ? challengeTrackerOptions.show
      : false
    this.challengeTrackerOptions.outerTotal = challengeTrackerOptions.outerTotal ?? ChallengeTrackerSettings.default.outerTotal
    this.challengeTrackerOptions.innerTotal = challengeTrackerOptions.innerTotal ?? ChallengeTrackerSettings.default.innerTotal
    this.challengeTrackerOptions.outerCurrent = challengeTrackerOptions.outerCurrent ?? ChallengeTrackerSettings.default.outerCurrent
    this.challengeTrackerOptions.innerCurrent = challengeTrackerOptions.innerCurrent ?? ChallengeTrackerSettings.default.innerCurrent
    this.challengeTrackerOptions.outerColor = challengeTrackerOptions.outerColor ?? null
    this.challengeTrackerOptions.outerBackgroundColor = challengeTrackerOptions.outerBackgroundColor ?? null
    this.challengeTrackerOptions.innerColor = challengeTrackerOptions.innerColor ?? null
    this.challengeTrackerOptions.innerBackgroundColor = challengeTrackerOptions.innerBackgroundColor ?? null
    this.challengeTrackerOptions.frameColor = challengeTrackerOptions.frameColor ?? null
    this.challengeTrackerOptions.frameWidth = challengeTrackerOptions.frameWidth ?? null
    this.challengeTrackerOptions.size = challengeTrackerOptions.size ?? null
    this.challengeTrackerOptions.windowed = [true, false].includes(challengeTrackerOptions.windowed)
      ? challengeTrackerOptions.windowed
      : null
    this.challengeTrackerOptions.persist = [true, false].includes(challengeTrackerOptions.persist)
      ? challengeTrackerOptions.persist
      : false

    // Local Options
    this.frameColor = null
    this.frameColorHighlight1 = null
    this.frameColorHighlight2 = null
    this.frameWidth = null
    this.innerBackgroundColor = null
    this.innerBackgroundColorShade = null
    this.innerColor = null
    this.innerColorShade = null
    this.outerBackgroundColor = null
    this.outerBackgroundColorShade = null
    this.outerColor = null
    this.outerColorShade = null
    this.size = null
    this.windowed = null
    this.backgroundImage = new Image()
    this.foregroundImage = new Image()
    // this.setVariables() // Set values from challengeTrackerOptions or module settings for local variables

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

  /* Set values from challengeTrackerOptions or module settings for local variables */
  async setVariables () {
    this.frameWidth = this.challengeTrackerOptions.frameWidth ??
      Utils.getSetting('challenge-tracker', 'frameWidth', ChallengeTrackerSettings.default.frameWidth)
    this.size = this.challengeTrackerOptions.size ??
      Utils.getSetting('challenge-tracker', 'size', ChallengeTrackerSettings.default.size)
    this.windowed = this.challengeTrackerOptions.windowed ??
      Utils.getSetting('challenge-tracker', 'windowed', ChallengeTrackerSettings.default.windowed)

    if (this.challengeTrackerOptions.foregroundImage && this.foregroundImage.src !== this.challengeTrackerOptions.foregroundImage) {
      this.foregroundImage.src = this.challengeTrackerOptions.foregroundImage
    }
    if (this.challengeTrackerOptions.backgroundImage && this.backgroundImage.src !== this.challengeTrackerOptions.backgroundImage) {
      this.backgroundImage.src = this.challengeTrackerOptions.backgroundImage
    }
    await this.loadImages()

    // Base Colors
    this.outerBackgroundColor = (this.challengeTrackerOptions.outerBackgroundColor)
      ? this.challengeTrackerOptions.outerBackgroundColor
      : Utils.getSetting('challenge-tracker', 'outerBackgroundColor', ChallengeTrackerSettings.default.outerBackgroundColor)
    this.outerColor = (this.challengeTrackerOptions.outerColor)
      ? this.challengeTrackerOptions.outerColor
      : Utils.getSetting('challenge-tracker', 'outerColor', ChallengeTrackerSettings.default.outerColor)
    this.innerBackgroundColor = (this.challengeTrackerOptions.innerBackgroundColor)
      ? this.challengeTrackerOptions.innerBackgroundColor
      : Utils.getSetting('challenge-tracker', 'innerBackgroundColor', ChallengeTrackerSettings.default.innerBackgroundColor)
    this.innerColor = (this.challengeTrackerOptions.innerColor)
      ? this.challengeTrackerOptions.innerColor
      : Utils.getSetting('challenge-tracker', 'innerColor', ChallengeTrackerSettings.default.innerColor)
    this.frameColor = (this.challengeTrackerOptions.frameColor)
      ? this.challengeTrackerOptions.frameColor
      : Utils.getSetting('challenge-tracker', 'frameColor', ChallengeTrackerSettings.default.frameColor)

    this.updateColor(this.outerBackgroundColor, this.outerColor, this.innerBackgroundColor, this.innerColor, this.frameColor)
  }

  async loadImages () {
    let counter = 0
    while (
      (
        (this.challengeTrackerOptions.foregroundImage && !this.foregroundImage.complete) ||
        (this.challengeTrackerOptions.backgroundImage && !this.backgroundImage.complete)
      ) &&
      counter < 10
    ) {
      await Utils.sleep(1000)
      counter++
    }
  }

  /**
  * Open a Challenge Tracker
  * @param {number} outerTotal Number of segments for the outer ring
  * @param {number} innerTotal Number of segments for the inner circle
  * @param {array} [challengeTrackerOptions] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {number} challengeTrackerOptions.listPosition Position of the challenge tracker in the Challenge Tracker list
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {string} challengeTrackerOptions.ownerId Owner of the challenge tracker
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  static open (
    arg1 = null,
    arg2 = null,
    arg3 = null
  ) {
    // Set defaults
    let challengeTrackerOptions = {
      backgroundImage: null,
      closeFunction: null,
      frameColor: null,
      frameWidth: null,
      id: null,
      foregroundImage: null,
      innerBackgroundColor: null,
      innerColor: null,
      innerCurrent: ChallengeTrackerSettings.default.innerCurrent,
      innerTotal: ChallengeTrackerSettings.default.innerTotal,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: null,
      outerColor: null,
      outerCurrent: ChallengeTrackerSettings.default.outerCurrent,
      outerTotal: ChallengeTrackerSettings.default.outerTotal,
      ownerId: null,
      persist: ChallengeTrackerSettings.default.persist,
      show: ChallengeTrackerSettings.default.show,
      size: ChallengeTrackerSettings.default.size,
      title: ChallengeTrackerSettings.default.title,
      windowed: null
    }
    switch (arguments.length) {
      case 1:
        if (typeof arg1 === 'object') {
          challengeTrackerOptions = arg1
        }
        if (typeof arg1 === 'number') {
          challengeTrackerOptions.outerTotal = arg1
        }
        break
      case 2:
        if (typeof arg1 === 'number') {
          challengeTrackerOptions.outerTotal = arg1
        }
        if (typeof arg2 === 'object') {
          challengeTrackerOptions = arg2
          challengeTrackerOptions.outerTotal = arg1
        }
        if (typeof arg2 === 'number') {
          challengeTrackerOptions.innerTotal = arg2
        }
        break
      case 3:
        if (typeof arg1 === 'number') {
          challengeTrackerOptions.outerTotal = arg1
        }
        if (typeof arg2 === 'number') {
          challengeTrackerOptions.innerTotal = arg2
        }
        if (typeof arg3 === 'object') {
          challengeTrackerOptions = arg3
          challengeTrackerOptions.outerTotal = arg1
          challengeTrackerOptions.innerTotal = arg2
        }
    }

    // Validate challengeTrackerOptions
    if (!ChallengeTracker.validateOptions(challengeTrackerOptions)) return

    const ownerId = challengeTrackerOptions.ownerId ?? game.userId
    const executorId = game.userId

    // When user is not allowed to show challenge tracker to others, overwrite show to false
    const userRole = game.user.role
    if (!Utils.checkAllowShow(userRole)) challengeTrackerOptions.show = false

    // When id is included, attempt to merge options from flag
    if (challengeTrackerOptions.id) {
      const flag = ChallengeTrackerFlag.get(ownerId, challengeTrackerOptions.id)
      if (flag) {
        challengeTrackerOptions = foundry.utils.mergeObject(flag, challengeTrackerOptions)
      } else {
        ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerOptions.id }))
        return
      }
    }

    // Set unique id for each Challenge Tracker
    challengeTrackerOptions.id = challengeTrackerOptions.id ??
      `${ChallengeTrackerSettings.id}-${Math.random().toString(16).slice(2)}`

    // Set listPosition
    const flagLength = (game.user.data.flags['challenge-tracker']) ? Object.keys(game.users.get(ownerId).data.flags['challenge-tracker']).length + 1 : 1

    challengeTrackerOptions.listPosition =
      challengeTrackerOptions.listPosition ??
      flagLength

    // Set title
    challengeTrackerOptions.title = challengeTrackerOptions.title ?? ChallengeTrackerSettings.default.title

    // Convert functions to string
    if (challengeTrackerOptions.openFunction) {
      const openFunction = Utils.functionToString(challengeTrackerOptions.openFunction)
      challengeTrackerOptions.openFunction = openFunction
    }
    if (challengeTrackerOptions.closeFunction) {
      const closeFunction = Utils.functionToString(challengeTrackerOptions.closeFunction)
      challengeTrackerOptions.closeFunction = closeFunction
    }

    // Call openHandler for only GM or everyone
    if (challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'openHandler',
        challengeTrackerOptions,
        { id: challengeTrackerOptions.id, title: challengeTrackerOptions.title },
        ownerId,
        executorId

      )
    } else {
      ChallengeTracker.openHandler(
        challengeTrackerOptions,
        { id: challengeTrackerOptions.id, title: challengeTrackerOptions.title },
        ownerId,
        executorId
      )
    }
  }

  /**
  * Open Challenge Tracker by id or open a new Challenge Tracker
  * @param {array} [challengeTrackerOptions] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {number} challengeTrackerOptions.listPosition Position of the challenge tracker in the Challenge Tracker list
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  * @param {array} options id, template, title
  * @param {string} ownerId User that created the Challenge Tracker
  * @param {string} executorId User that executed the method
  **/
  static async openHandler (challengeTrackerOptions, options, ownerId, executorId) {
    const challengeTrackerId = options.id

    // Convert openFunction back to function and execute
    if (challengeTrackerOptions.openFunction) {
      const openFunction = Utils.stringToFunction(challengeTrackerOptions.openFunction)
      if (typeof openFunction === 'function') {
        openFunction()
      }
    }

    // Add new Challenge Tracker or update client variables
    if (!game.challengeTracker[challengeTrackerId]) {
      await renderTemplate(ChallengeTrackerSettings.templates.challengeTracker)
      game.challengeTracker[challengeTrackerId] = new ChallengeTracker(
        challengeTrackerOptions,
        options,
        ownerId,
        executorId
      )
    } else {
      const challengeTracker = game.challengeTracker[challengeTrackerId]
      challengeTracker.challengeTrackerOptions = challengeTrackerOptions
      // Switch the Show/Hide element for the owner
      if ((game.user.isGM || game.userId === challengeTracker.ownerId) &&
        game.userId !== executorId && !challengeTracker.challengeTrackerOptions.show) {
        const show = true
        challengeTracker.updateShowHideElement(show)
        return
      }
    }

    // Render the Challenge Tracker
    game.challengeTracker[challengeTrackerId].render(true)
  }

  /**
   * Close all Challenge Trackers
   * @param {string} [title=null] Title of the challenge tracker
   */
  static closeAll () {
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker._close()
    }
  }

  /**
  * Close Challenge Tracker by title
  * @param {string} [title=null] Title of the challenge tracker
  */
  static closeByTitle (title = null) {
    if (!title) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'title', function: 'ChallengeTracker.closeByTitle' }))
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === title)
    if (challengeTracker) challengeTracker._close()
  }

  /**
  * Close Challenge Tracker by id
  * @param {string} [id=null] Id of the challenge tracker
  */
  static closeById (id = null) {
    if (!id) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'id', function: 'ChallengeTracker.closeById' }))
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === id)
    if (challengeTracker) challengeTracker._close()
  }

  /* Add click even to the Close element */
  closeEvent () {
    this.element.find('.close').one('click', () => this._close())
  }

  /* Close Challenge Tracker by event or close method */
  _close () {
    if (!game.user.isGM && !Utils.checkUserId(this.ownerId)) return
    const executorId = game.userId
    this.eventListenerController.abort()
    ChallengeTrackerSocket.executeForEveryone(
      'closeHandler',
      this.options,
      executorId
    )
  }

  /**
  * Close the Challenge Tracker by Id
  * @param {array} options id, template, title
  * @param {string} executorId User that executed the method
  **/
  static closeHandler (options, executorId) {
    const challengeTrackerId = options.id

    if (!game.challengeTracker) return
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.id === options.id)
    if (!challengeTracker) return

    // Keep open for owner, instead switch the Show/Hide element
    if (game.userId === challengeTracker.ownerId && executorId !== challengeTracker.ownerId) {
      const show = false
      challengeTracker.updateShowHideElement(show)
      return
    }

    // Convert closeFunction back to function
    if (challengeTracker.challengeTrackerOptions.closeFunction) {
      const closeFunction = Utils.stringToFunction(challengeTracker.challengeTrackerOptions.closeFunction)
      if (typeof closeFunction === 'function') {
        closeFunction()
      }
    }
    const closeFunction = challengeTracker.challengeTrackerOptions.closeFunction
    if (typeof closeFunction === 'function') closeFunction()

    challengeTracker.close()
    delete game.challengeTracker[challengeTrackerId]
  }

  getData (options) {
    return {}
  }

  /* Update HTML elements post render */
  activateListeners (html) {
    super.activateListeners(html)

    // Add class to handle CSS across all Challenge Trackers
    this.element.addClass('challenge-tracker')

    const hasPermission = (game.user.isGM || Utils.checkUserId(this.ownerId))
    // Update elements on window header
    if (hasPermission) {
      this.updateCloseElement(Utils.getSetting('challenge-tracker', 'size', ChallengeTrackerSettings.default.size))
      const showHideElement = this.element.find('.show-hide')
      if (showHideElement.length === 0) this.element.find('.close').before('<a class="show-hide"></a>')
      this.updateShowHideElement()
    }

    // Remove the Close button for players
    if (!game.user.isGM && !Utils.checkUserId(this.ownerId)) this.element.find('.header-button.close').remove()

    // Add class for windowless mode
    if (this.windowed) {
      this.element.removeClass('windowless')
    } else {
      this.element.addClass('windowless')
    }

    if (game.user.isGM || Utils.checkUserId(this.ownerId)) {
      this.canvasFrame = this.element.find('#challenge-tracker-canvas-frame')[0]
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
      if (Utils.getSetting('challenge-tracker', 'scroll', ChallengeTrackerSettings.default.scroll)) {
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
    if (this.challengeTrackerOptions.innerTotal > 0 && this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent === this.challengeTrackerOptions.innerTotal)
        ? this.challengeTrackerOptions.innerTotal
        : this.challengeTrackerOptions.innerCurrent + 1
      this._draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent === this.challengeTrackerOptions.outerTotal)
        ? this.challengeTrackerOptions.outerTotal
        : this.challengeTrackerOptions.outerCurrent + 1
      this._draw()
    }
  }

  /**
  * Decrease current segments on mouse right-click
  * @param {object} event Listener event
  **/
  challengeTrackerContextMenuEvent (event) {
    if (this.challengeTrackerOptions.innerTotal > 0 &&
      this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent === 0)
        ? this.challengeTrackerOptions.innerTotal
        : this.challengeTrackerOptions.innerCurrent - 1
      this._draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY)) {
      event.preventDefault()
      this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent === 0)
        ? this.challengeTrackerOptions.outerTotal
        : this.challengeTrackerOptions.outerCurrent - 1
      this._draw()
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
    if (this.challengeTrackerOptions.innerTotal > 0 && this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.challengeTrackerOptions.innerTotal > 1) this.challengeTrackerOptions.innerTotal--
        this.challengeTrackerOptions.innerCurrent =
          (this.challengeTrackerOptions.innerCurrent > this.challengeTrackerOptions.innerTotal)
            ? this.challengeTrackerOptions.innerTotal
            : this.challengeTrackerOptions.innerCurrent
        this._draw()
      }
      if (event.code === 'Equal') {
        this.challengeTrackerOptions.innerTotal++
        this._draw()
      }
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      console.log(event.code)
      if (event.code === 'Minus') {
        if (this.challengeTrackerOptions.outerTotal > 1) this.challengeTrackerOptions.outerTotal--
        this._draw()
      }
      if (event.code === 'Equal') {
        this.challengeTrackerOptions.outerTotal++
        this._draw()
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
    if (this.challengeTrackerOptions.innerTotal > 0 && this.contextFrame.isPointInPath(this.innerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.challengeTrackerOptions.innerTotal > 1) this.challengeTrackerOptions.innerTotal--
        this.challengeTrackerOptions.innerCurrent =
          (this.challengeTrackerOptions.innerCurrent > this.challengeTrackerOptions.innerTotal)
            ? this.challengeTrackerOptions.innerTotal
            : this.challengeTrackerOptions.innerCurrent
      }
      if (event.deltaY < 0) {
        this.challengeTrackerOptions.innerTotal++
      }
      this._draw()
    } else if (this.contextFrame.isPointInPath(this.outerArc, x, y)) {
      if (event.deltaY > 0) {
        if (this.challengeTrackerOptions.outerTotal > 1) this.challengeTrackerOptions.outerTotal--
        this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent > this.challengeTrackerOptions.outerTotal)
          ? this.challengeTrackerOptions.outerTotal
          : this.challengeTrackerOptions.outerCurrent
      }
      if (event.deltaY < 0) {
        this.challengeTrackerOptions.outerTotal++
      }
      this._draw()
    }
  }

  /**
  * Draw Challenge Tracker by Id
  * @param {array} [challengeTrackerOptions=null] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  async draw (challengeTrackerOptions = null) {
    if (challengeTrackerOptions) this.challengeTrackerOptions = challengeTrackerOptions
    this.updateShowHide()
    this._draw()
  }

  /* Draw the Challenge Tracker */
  _draw () {
    // Call drawHandler for executor only or everyone
    const isExecutor = Utils.checkUserId(this.executorId)
    if (isExecutor && this.challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForEveryone(
        'drawHandler',
        this.challengeTrackerOptions,
        this.options
      )
    } else {
      ChallengeTracker.drawHandler(
        this.challengeTrackerOptions,
        this.options
      )
    }
    if (isExecutor && this.challengeTrackerOptions.persist) {
      ChallengeTrackerFlag.set(this.ownerId, this.challengeTrackerOptions)
    }
  }

  /**
  * Draw Challenge Tracker by ID
  * @param {array} challengeTrackerOptions Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  * @param {array} options id, template, title
  **/
  static async drawHandler (challengeTrackerOptions, options) {
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.id === options.id)
    if (!challengeTracker) return
    await challengeTracker.setVariables()
    challengeTracker.drawCanvas(challengeTrackerOptions)
    if (challengeTrackerOptions.windowed) {
      challengeTracker.element.removeClass('windowless')
    } else {
      challengeTracker.element.addClass('windowless')
    }
  }

  /**
  * Draw the Challenge Tracker canvas
  * @param {array} challengeTrackerOptions Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  drawCanvas (challengeTrackerOptions) {
    // Set variables
    this.challengeTrackerOptions = challengeTrackerOptions
    const canvasSize = this.size
    const halfCanvasSize = canvasSize / 2
    let lineWidth
    switch (this.frameWidth) {
      case 'extra-thin':
        lineWidth = 1
        break
      case 'thin':
        lineWidth = Math.round(canvasSize / 40)
        break
      case 'medium':
        lineWidth = Math.round(canvasSize / 30)
        break
      case 'thick':
        lineWidth = Math.round(canvasSize / 20)
        break
      case 'none':
        lineWidth = 0
        break
      default:
        lineWidth = Math.round(canvasSize / 30)
    }
    const halfLineWidth = (lineWidth === 0) ? 0 : lineWidth / 2
    const radius = halfCanvasSize - lineWidth
    this.position.width = canvasSize
    this.position.height = 'auto'

    const windowApp = this.element[0]
    const wrapper = this.element.find('#challenge-tracker-wrapper')[0]
    this.canvasFrame = this.element.find('#challenge-tracker-canvas-frame')[0]
    this.contextFrame = this.canvasFrame.getContext('2d')
    const canvas = this.element.find('#challenge-tracker-canvas')[0]
    const context = canvas.getContext('2d')
    const canvasImage = this.element.find('#challenge-tracker-canvas-image')[0]
    const contextImage = canvasImage.getContext('2d')

    windowApp.style.width = 'auto'
    windowApp.style.height = 'auto'
    wrapper.style.width = canvasSize + 'px'
    wrapper.style.height = canvasSize + 'px'
    this.canvasFrame.setAttribute('height', canvasSize)
    this.canvasFrame.setAttribute('width', canvasSize)
    canvas.setAttribute('height', canvasSize)
    canvas.setAttribute('width', canvasSize)
    canvasImage.setAttribute('height', canvasSize)
    canvasImage.setAttribute('width', canvasSize)
    this.innerArc = new Path2D()
    this.outerArc = new Path2D()

    const outerRemaining = this.challengeTrackerOptions.outerTotal - this.challengeTrackerOptions.outerCurrent
    const innerRemaining = this.challengeTrackerOptions.innerTotal - this.challengeTrackerOptions.innerCurrent
    const outerSliceRadians = (360 / this.challengeTrackerOptions.outerTotal) * Math.PI / 180
    const innerSliceRadians = (360 / this.challengeTrackerOptions.innerTotal) * Math.PI / 180
    const startAngle = 1.5 * Math.PI
    const outerEndAngle = (outerSliceRadians * this.challengeTrackerOptions.outerCurrent) + 1.5 * Math.PI
    const innerEndAngle = (innerSliceRadians * this.challengeTrackerOptions.innerCurrent) + 1.5 * Math.PI

    // IMAGE CANVAS

    // Clear drawing on canvas image element
    contextImage.clearRect(0, 0, canvasSize, canvasSize)

    // DRAW FOREGROUND IMAGE
    if (this.challengeTrackerOptions.foregroundImage) {
      if (this.challengeTrackerOptions.outerCurrent > 0) {
        contextImage.beginPath()
        contextImage.moveTo(halfCanvasSize, halfCanvasSize)
        contextImage.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle)
        contextImage.fillStyle = 'rgba(0, 0, 0, 1)'
        contextImage.fill()
        contextImage.closePath()
      }
      if (this.challengeTrackerOptions.innerTotal > 0) {
        // Remove centre of outer ring for the inner circle
        contextImage.save()
        contextImage.beginPath()
        contextImage.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
        contextImage.globalCompositeOperation = 'destination-out'
        contextImage.fillStyle = 'rgba(0, 0, 0, 1)'
        contextImage.fill()
        contextImage.closePath()
        contextImage.restore()
      }
      if (this.challengeTrackerOptions.innerCurrent > 0) {
        contextImage.beginPath()
        contextImage.moveTo(halfCanvasSize, halfCanvasSize)
        contextImage.arc(
          halfCanvasSize,
          halfCanvasSize,
          radius / 5 * 3,
          startAngle,
          innerEndAngle
        )
        contextImage.fillStyle = 'rgba(0, 0, 0, 1)'
        contextImage.fill()
        contextImage.closePath()
      }
      contextImage.globalCompositeOperation = 'source-in'
      contextImage.drawImage(this.foregroundImage, lineWidth, lineWidth, canvasSize - (lineWidth * 2), canvasSize - (lineWidth * 2))
    }

    // DRAW BACKGROUND IMAGE
    if (this.challengeTrackerOptions.backgroundImage) {
      contextImage.globalCompositeOperation = 'destination-over'
      contextImage.drawImage(this.backgroundImage, lineWidth, lineWidth, canvasSize - (lineWidth * 2), canvasSize - (lineWidth * 2))
    }

    // CANVAS

    // Clear drawing on background canvas element
    context.clearRect(0, 0, canvasSize, canvasSize)

    // Set outer ring background gradient
    const outerBackgroundGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3,
      halfCanvasSize,
      halfCanvasSize,
      radius
    )
    outerBackgroundGradient.addColorStop(0, this.outerBackgroundColor)
    outerBackgroundGradient.addColorStop(1, this.outerBackgroundColorShade)

    // Draw outer ring background
    if (outerRemaining > 0) {
      context.beginPath()
      context.moveTo(halfCanvasSize, halfCanvasSize)
      if (outerRemaining === this.challengeTrackerOptions.outerTotal) {
        context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, -0.5 * Math.PI, true)
      } else {
        context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle, true)
      }
      context.fillStyle = outerBackgroundGradient
      context.fill()
      context.closePath()
    }
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
    if (this.challengeTrackerOptions.outerCurrent > 0) {
      context.beginPath()
      context.moveTo(halfCanvasSize, halfCanvasSize)
      context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle)
      context.fillStyle = outerGradient
      context.fill()
      context.closePath()
    }

    if (this.challengeTrackerOptions.innerTotal > 0) {
      // Remove centre of outer ring for the inner circle
      context.save()
      context.beginPath()
      context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
      context.globalCompositeOperation = 'destination-out'
      context.fillStyle = 'rgba(0, 0, 0, 1)'
      context.fill()
      context.closePath()
      context.restore()

      // Set inner circle background gradient
      const innerBackgroundGradient = context.createRadialGradient(
        halfCanvasSize,
        halfCanvasSize,
        0,
        halfCanvasSize,
        halfCanvasSize,
        radius / 5 * 3
      )
      innerBackgroundGradient.addColorStop(0, this.innerBackgroundColor)
      innerBackgroundGradient.addColorStop(1, this.innerBackgroundColorShade)

      // Draw inner circle background
      if (innerRemaining > 0) {
        context.beginPath()
        context.moveTo(halfCanvasSize, halfCanvasSize)
        if (innerRemaining === this.challengeTrackerOptions.innerTotal) {
          context.arc(
            halfCanvasSize,
            halfCanvasSize,
            radius / 5 * 3,
            startAngle,
            -0.5 * Math.PI,
            true
          )
        } else {
          context.arc(
            halfCanvasSize,
            halfCanvasSize,
            radius / 5 * 3,
            startAngle,
            innerEndAngle,
            true
          )
        }
        context.fillStyle = innerBackgroundGradient
        context.fill()
        context.closePath()
      }

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
      if (this.challengeTrackerOptions.innerCurrent > 0) {
        context.beginPath()
        context.moveTo(halfCanvasSize, halfCanvasSize)
        context.arc(
          halfCanvasSize,
          halfCanvasSize,
          radius / 5 * 3,
          startAngle,
          innerEndAngle
        )
        context.fillStyle = innerGradient
        context.fill()
        context.closePath()
      }
    }

    // FRAME CANVAS

    // Clear drawing on canvasFrame element
    this.contextFrame.clearRect(0, 0, canvasSize, canvasSize)

    if (lineWidth !== 0) {
    // Draw frame
      this.contextFrame.beginPath()
      this.contextFrame.shadowOffsetX = halfLineWidth / 2
      this.contextFrame.shadowOffsetY = halfLineWidth / 2
      this.contextFrame.shadowColor = 'rgba(0, 0, 0, 0.25)'
      this.contextFrame.shadowBlur = halfLineWidth

      // Draw lines between segments of outer ring
      this.contextFrame.save()
      this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
      this.contextFrame.rotate(outerSliceRadians * this.challengeTrackerOptions.outerTotal / 2)
      if (this.challengeTrackerOptions.outerTotal > 1) {
        for (let outerSlice = 1; outerSlice <= this.challengeTrackerOptions.outerTotal; outerSlice++) {
          if (outerSlice > 1) this.contextFrame.rotate(outerSliceRadians)
          if (this.challengeTrackerOptions.innerTotal > 0) {
            this.contextFrame.moveTo(0, radius / 5 * 3)
          } else {
            this.contextFrame.moveTo(0, 0)
          }
          this.contextFrame.lineTo(0, radius)
        }
      }
      this.contextFrame.restore()

      if (this.challengeTrackerOptions.innerTotal > 0) {
      // Draw lines between segments of inner circle
        this.contextFrame.save()
        this.contextFrame.translate(halfCanvasSize, halfCanvasSize)
        this.contextFrame.rotate(innerSliceRadians * this.challengeTrackerOptions.innerTotal / 2)
        if (this.challengeTrackerOptions.innerTotal > 1) {
          for (let innerSlice = 1; innerSlice <= this.challengeTrackerOptions.innerTotal; innerSlice++) {
            if (innerSlice > 1) this.contextFrame.rotate(innerSliceRadians)
            this.contextFrame.moveTo(0, 0)
            this.contextFrame.lineTo(0, radius / 5 * 3)
          }
        }
        this.contextFrame.restore()
      }

      // Stroke lines
      this.contextFrame.strokeStyle = this.frameColor
      this.contextFrame.lineWidth = halfLineWidth
      this.contextFrame.stroke()
      this.contextFrame.closePath()
    }

    // Draw circles
    // Set inner circle gradient
    const outerFrameGradient = context.createRadialGradient(
      halfCanvasSize + (halfLineWidth / 4),
      halfCanvasSize + (halfLineWidth / 4),
      radius - halfLineWidth - (halfLineWidth / 4),
      halfCanvasSize + (halfLineWidth / 4),
      halfCanvasSize + (halfLineWidth / 4),
      radius + halfLineWidth + (halfLineWidth / 4)
    )
    outerFrameGradient.addColorStop(0, this.frameColorHighlight2)
    outerFrameGradient.addColorStop(0.1, this.frameColorHighlight1)
    outerFrameGradient.addColorStop(0.3, this.frameColor)
    outerFrameGradient.addColorStop(0.7, this.frameColor)
    outerFrameGradient.addColorStop(0.9, this.frameColorHighlight1)
    outerFrameGradient.addColorStop(1, this.frameColorHighlight2)
    this.contextFrame.beginPath()
    this.contextFrame.strokeStyle = outerFrameGradient
    this.contextFrame.lineWidth = lineWidth
    this.outerArc.arc(halfCanvasSize, halfCanvasSize, radius, 0, 2 * Math.PI)
    this.contextFrame.stroke(this.outerArc)
    this.contextFrame.closePath()

    if (this.challengeTrackerOptions.innerTotal > 0) {
      const innerFrameGradient = context.createRadialGradient(
        halfCanvasSize + (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        (radius / 5 * 3) - halfLineWidth - (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        (radius / 5 * 3) + halfLineWidth + (halfLineWidth / 4)
      )
      innerFrameGradient.addColorStop(0, this.frameColorHighlight2)
      innerFrameGradient.addColorStop(0.1, this.frameColorHighlight1)
      innerFrameGradient.addColorStop(0.3, this.frameColor)
      innerFrameGradient.addColorStop(0.7, this.frameColor)
      innerFrameGradient.addColorStop(0.9, this.frameColorHighlight1)
      innerFrameGradient.addColorStop(1, this.frameColorHighlight2)
      this.contextFrame.beginPath()
      this.contextFrame.strokeStyle = innerFrameGradient
      this.contextFrame.lineWidth = lineWidth
      this.innerArc.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI)
      this.contextFrame.stroke(this.innerArc)
      this.contextFrame.closePath()
    }
  }

  /**
  * Set colors and draw all Challenge Trackers based on the module settings
  * @param {string} outerBackgroundColor Hex color for the outer ring background
  * @param {string} outerColor Hex color for the outer ring
  * @param {string} innerBackgroundColor Hex color for the inner circle
  * @param {string} innerColor Hex color for the inner circle
  * @param {string} frameColor Hex color for the frame
  **/
  static updateColorAndDraw (outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor) {
    if (!game.challengeTracker) return
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.updateColor(outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor)
      challengeTracker._draw()
    }
  }

  /**
  * Update colors on all Challenge Trackers based on options or the module settings
  * @param {string} outerBackgroundColor Hex color for the outer ring background
  * @param {string} outerColor Hex color for the outer ring
  * @param {string} innerBackgroundColor Hex color for the inner circle background
  * @param {string} innerColor Hex color for the inner circle
  * @param {string} frameColor Hex color for the frame
  **/
  updateColor (outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor) {
    this.outerBackgroundColor = (this.challengeTrackerOptions.outerBackgroundColor)
      ? this.challengeTrackerOptions.outerBackgroundColor
      : outerBackgroundColor
    this.outerColor = (this.challengeTrackerOptions.outerColor)
      ? this.challengeTrackerOptions.outerColor
      : outerColor
    this.innerBackgroundColor = (this.challengeTrackerOptions.innerBackgroundColor)
      ? this.challengeTrackerOptions.innerBackgroundColor
      : innerBackgroundColor
    this.innerColor = (this.challengeTrackerOptions.innerColor)
      ? this.challengeTrackerOptions.innerColor
      : innerColor
    this.frameColor = this.frameColor = (this.challengeTrackerOptions.frameColor)
      ? this.challengeTrackerOptions.frameColor
      : frameColor
    this.outerColorShade = Utils.shadeColor(this.outerColor, 1.25)
    this.innerColorShade = Utils.shadeColor(this.innerColor, 1.25)
    this.outerBackgroundColorShade = Utils.shadeColor(this.outerBackgroundColor, 1.25)
    this.innerBackgroundColorShade = Utils.shadeColor(this.innerBackgroundColor, 1.25)
    this.frameColorHighlight1 = Utils.shadeColor(this.frameColor, 0.9)
    this.frameColorHighlight2 = Utils.shadeColor(this.frameColor, 0.4)
  }

  /**
  * Set frame width on all Challenge Trackers based on the module setting
  * @param {string} frameWidth thin, medium, thick
  **/
  static updateFrameWidth (frameWidth) {
    if (!game.challengeTracker) return
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.frameWidth = challengeTracker.challengeTrackerOptions.frameWidth ?? frameWidth
      challengeTracker._draw()
    }
  }

  /**
  * Update size of all Challenge Trackers based on the module setting
  * @param {number} size Size of the Challenge Tracker in pixels
  **/
  static updateSize (size) {
    if (!game.challengeTracker) return
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.size = challengeTracker.challengeTrackerOptions.size ?? size
      challengeTracker.updateShowHideElement()
      challengeTracker.updateCloseElement()
      challengeTracker._draw()
    }
  }

  /**
  * Update window visibility of all Challenge Trackers based on the module setting
  * @param {boolean} windowed true = Windowed, false = Windowless
  **/
  static updateWindowed (windowed) {
    if (!game.challengeTracker) return
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if ([true, false].includes(challengeTracker.challengeTrackerOptions.windowed)) return
      if (windowed) {
        challengeTracker.element.removeClass('windowless')
      } else {
        challengeTracker.element.addClass('windowless')
      }
    }
  }

  /**
  * Enable/disable scroll wheel event on all Challenge Trackers based on the module setting
  * @param {boolean} scroll Enable (true) or disable (false) the scroll wheel event
  **/
  static updateScroll (scroll) {
    if (!game.challengeTracker) return
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if (scroll) {
        if (challengeTracker.eventListenerSignalScroll == null || challengeTracker.eventListenerSignalScroll.aborted) {
          challengeTracker.eventListenerControllerScroll = new AbortController()
          challengeTracker.eventListenerSignalScroll = challengeTracker.eventListenerControllerScroll.signal
          document.addEventListener('wheel', (event) => challengeTracker.challengeTrackerWheelEvent(event),
            { signal: challengeTracker.eventListenerSignalScroll }
          )
        }
      } else {
        if (challengeTracker.eventListenerSignalScroll !== null && !challengeTracker.eventListenerSignalScroll.aborted) {
          challengeTracker.eventListenerControllerScroll.abort()
        }
      }
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
    this.closeEvent()
  }

  /**
  * Update the Show/Hide element of the Challenge Tracker
  * @param {boolean} show true = Show, false = Hide
  **/
  updateShowHideElement (show = this.challengeTrackerOptions.show) {
    const userRole = game.user.role
    if (!Utils.checkAllowShow(userRole)) return
    this.challengeTrackerOptions.show = show
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
    if (this.challengeTrackerOptions.size < 300) showHideHtmlText = ''
    const showHideHtml = `<a class="show-hide"><i class="${showHideHtmlIcon}"></i>${showHideHtmlText}</a>`
    showHideElement.replaceWith(showHideHtml)
    this.showHideEvent()
  }

  /* Show/hide the Challenge Tracker for others */
  updateShowHide (executorId) {
    const isExecutor = Utils.checkUserId(executorId)
    if (isExecutor && this.challengeTrackerOptions.show) {
      ChallengeTrackerSocket.executeForOthers(
        'openHandler',
        this.challengeTrackerOptions,
        this.options,
        executorId
      )
    } else {
      ChallengeTrackerSocket.executeForOthers(
        'closeHandler',
        this.options,
        executorId
      )
    }
    this.updateShowHideElement()
    ChallengeTrackerFlag.set(this.ownerId, this.challengeTrackerOptions)
  }

  /* Switch the challengeTrackerOptions.show value */
  switchShowHide () {
    const executorId = game.userId
    this.challengeTrackerOptions.show = !(this.challengeTrackerOptions.show)
    this.updateShowHide(executorId)
  }

  /* Add click event to the Show/Hide element */
  showHideEvent () {
    this.element.find('.show-hide').one('click', () => this.switchShowHide())
  }

  /**
  * Show all Challenge Trackers
  **/
  static showAll () {
    const userRole = game.user.role
    if (!game.user.isGM && !Utils.checkAllowShow(userRole)) return
    if (!game.challengeTracker) return
    const executorId = game.userId
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if (game.user.isGM || Utils.checkUserId(challengeTracker.ownerId)) challengeTracker.showHandler(executorId)
    }
  }

  /**
  * Show Challenge Tracker by ID
  * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
  **/
  static showById (challengeTrackerId = null) {
    if (!challengeTrackerId) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'id', function: 'ChallengeTracker.showById' }))
      return
    }
    const userRole = game.user.role
    if (!game.user.isGM && !Utils.checkAllowShow(userRole)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notAllowed', { function: 'ChallengeTracker.showById' }))
      return
    }
    if (!game.challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerId }))
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
    if (!challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerId }))
      return
    }
    if (!game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notOwned', { value: challengeTrackerId }))
      return
    }
    const executorId = game.userId
    challengeTracker.showHandler(executorId)
  }

  /**
  * Show Challenge Tracker by title
  * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
  **/
  static showByTitle (challengeTrackerTitle = null) {
    if (!challengeTrackerTitle) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'title', function: 'ChallengeTracker.showByTitle' }))
      return
    }
    const userRole = game.user.role
    if (!game.user.isGM && !Utils.checkAllowShow(userRole)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notAllowed', { function: 'ChallengeTracker.showByTitle' }))
      return
    }
    if (!game.challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerTitle }))
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle)
    if (!challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerTitle }))
      return
    }
    if (!game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notOwned', { value: challengeTrackerTitle }))
      return
    }
    const executorId = game.userId
    challengeTracker.showHandler(executorId)
  }

  showHandler (executorId) {
    this.challengeTrackerOptions.show = true
    this.updateShowHide(executorId)
  }

  /**
  * Hide all Challenge Trackers
  **/
  static hideAll () {
    const userRole = game.user.role
    if (!game.user.isGM && !Utils.checkAllowShow(userRole)) return
    if (!game.challengeTracker) return
    const executorId = game.userId
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if (game.user.isGM || Utils.checkUserId(challengeTracker.ownerId)) challengeTracker.hideHandler(executorId)
    }
  }

  /**
  * Hide Challenge Tracker by ID
  * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
  **/
  static hideById (challengeTrackerId = null) {
    if (!challengeTrackerId) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'id', function: 'ChallengeTracker.hideById' }))
      return
    }
    const userRole = game.user.role
    if (!game.user.isGM && !Utils.checkAllowShow(userRole)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notAllowed', { function: 'ChallengeTracker.hideById' }))
      return
    }
    if (!game.challengeTracker) {
      ui.notifications.error(`Challenge Tracker '${challengeTrackerId}' does not exist.`)
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
    if (!challengeTracker) {
      ui.notifications.error(`Challenge Tracker '${challengeTrackerId}' does not exist.`)
      return
    }
    if (!game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notOwned', { value: challengeTrackerId }))
      return
    }
    const executorId = game.userId
    challengeTracker.hideHandler(executorId)
  }

  /**
  * Hide Challenge Tracker by title
  * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
  **/
  static hideByTitle (challengeTrackerTitle = null) {
    if (!challengeTrackerTitle) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'title', function: 'ChallengeTracker.hideByTitle' }))
      return
    }
    const userRole = game.user.role
    if (!game.user.isGM || !Utils.checkAllowShow(userRole)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notAllowed', { function: 'ChallengeTracker.hideByTitle' }))
      return
    }
    if (!game.challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerTitle }))
      return
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle)
    if (!challengeTracker) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerTitle }))
      return
    }
    if (!game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId)) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notOwned', { value: challengeTrackerTitle }))
      return
    }
    const executorId = game.userId
    challengeTracker.hideHandler(executorId)
  }

  hideHandler (executorId) {
    this.challengeTrackerOptions.show = false
    this.updateShowHide(executorId)
  }

  /**
  * Set Challenge Tracker by ID
  * @param {string} [challengeTrackerId = null] ID of the Challenge Tracker
  * @param {array} [challengeTrackerOptions] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {string} challengeTrackerOptions.ownerId Owner of the challenge tracker
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  static setById (challengeTrackerId, challengeTrackerOptions) {
    if (!ChallengeTracker.validateOptions(challengeTrackerOptions)) return
    let ownerId = game.userId

    // Set flag
    if (game.user.isGM) {
      for (const user of game.users.entries()) {
        const userId = user[0]
        const flagKey = Object.keys(game.users.get(userId)?.data.flags[ChallengeTrackerSettings.id]).find(ct => ct.id === challengeTrackerId)
        if (flagKey) ownerId = userId
      }
    }
    const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId)
    if (flagData) {
      challengeTrackerOptions = foundry.utils.mergeObject(flagData, challengeTrackerOptions)
      ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions)
    }

    // Set challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
    if (challengeTracker) {
      challengeTracker.challengeTrackerOptions = foundry.utils.mergeObject(challengeTracker.challengeTrackerOptions, challengeTrackerOptions)
      challengeTracker.render()
    }
  }

  /**
  * Set Challenge Tracker by title
  * @param {string} [challengeTrackerTitle = null] Title of the Challenge Tracker
  * @param {array} [challengeTrackerOptions] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {string} challengeTrackerOptions.ownerId Owner of the challenge tracker
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  static setByTitle (challengeTrackerTitle, challengeTrackerOptions) {
    if (!ChallengeTracker.validateOptions(challengeTrackerOptions)) return
    const ownerId = game.userId

    // Set flag
    const flagKey = Object.keys(game.user.data.flags[ChallengeTrackerSettings.id]).find(ct => ct.title === challengeTrackerTitle)
    if (flagKey) {
      const flagData = ChallengeTrackerFlag.get(ownerId, flagKey)
      challengeTrackerOptions = foundry.utils.mergeObject(flagData, challengeTrackerOptions)
      ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions)
    }

    // Set challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle)
    if (challengeTracker) {
      challengeTracker.challengeTrackerOptions = foundry.utils.mergeObject(challengeTracker.challengeTrackerOptions, challengeTrackerOptions)
      challengeTracker.render()
    }
  }

  /**
  * Delete all Challenge Trackers
  * Show dialog then pass to _deleteAll()
  **/
  static deleteAll () {
    // eslint-disable-next-line no-undef
    (() => new Dialog({
      title: game.i18n.localize('challengeTracker.labels.deleteAllDialog.title'),
      content: `<p>${game.i18n.localize('challengeTracker.labels.deleteAllDialog.body')}</p>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('challengeTracker.labels.yes'),
          callback: () => { ChallengeTracker._deleteAll() }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('challengeTracker.labels.no')
        }
      }
    }).render(true))()
  }

  /* Deleta all Challenge Tracker */
  static _deleteAll () {
    const ownerId = game.userId
    const challengeTrackerList = ChallengeTrackerFlag.getList(ownerId)
    for (const challengeTrackerFlag of challengeTrackerList) {
      const challengeTrackerId = challengeTrackerFlag.id

      // Delete flag
      ChallengeTrackerFlag.unset(ownerId, challengeTrackerId)

      // Un-persist challenge tracker
      if (game.challengeTracker) {
        const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
        if (challengeTracker) challengeTracker.challengeTrackerOptions.persist = false
      }
    }
  }

  /**
  * Delete Challenge Tracker by ID
  * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
  **/
  static deleteById (challengeTrackerId = null) {
    if (!challengeTrackerId) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'id', function: 'ChallengeTracker.deleteById' }))
      return
    }
    let ownerId = game.userId

    // Delete flag
    if (game.user.isGM) {
      for (const user of game.users.entries()) {
        const userId = user[0]
        const flagKey = Object.keys(game.users.get(userId)?.data.flags[ChallengeTrackerSettings.id]).find(ct => ct.id === challengeTrackerId)
        if (flagKey) {
          ownerId = userId
          break
        }
      }
    }
    ChallengeTrackerFlag.unset(ownerId, challengeTrackerId)

    // Un-persist challenge tracker
    if (game.challengeTracker) {
      const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
      if (challengeTracker) challengeTracker.challengeTrackerOptions.persist = false
    }
  }

  /**
  * Delete Challenge Tracker by title
  * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
  **/
  static deleteByTitle (challengeTrackerTitle = null) {
    if (!challengeTrackerTitle) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'title', function: 'ChallengeTracker.deleteByTitle' }))
      return
    }
    const ownerId = game.userId

    // Delete flag
    const flagKey = Object.keys(game.user.data.flags[ChallengeTrackerSettings.id]).find(ct => ct.title === challengeTrackerTitle)
    if (flagKey) {
      ChallengeTrackerFlag.unset(ownerId, flagKey)
    }

    // Un-persist challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle)
    if (challengeTracker) {
      challengeTracker.challengeTrackerOptions.persist = false
    }
  }

  /**
  * Get Challenge Tracker by ID
  * @param {string} [challengeTrackerId = null] ID of the Challenge Tracker
  */
  static getById (challengeTrackerId = null) {
    if (!challengeTrackerId) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'id', function: 'ChallengeTracker.getById' }))
      return
    }

    let ownerId = game.userId

    // Get flag
    if (game.user.isGM) {
      for (const user of game.users.entries()) {
        const userId = user[0]
        const flagKey = Object.keys(game.users.get(userId)?.data.flags[ChallengeTrackerSettings.id]).find(ct => ct.id === challengeTrackerId)
        if (flagKey) ownerId = userId
      }
    }
    const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId)
    if (flagData) return flagData

    // Get challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
    if (challengeTracker) {
      return challengeTracker.challengeTrackerOptions
    }
    ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerId }))
    return null
  }

  /**
  * Get Challenge Tracker by title
  * @param {string} [challengeTrackerId = null] Title of the Challenge Tracker
  */
  static getByTitle (challengeTrackerTitle = null) {
    if (!challengeTrackerTitle) {
      ui.notifications.error(game.i18n.format('challengeTracker.errors.notSupplied', { parameter: 'title', function: 'ChallengeTracker.getByTitle' }))
      return
    }

    const ownerId = game.userId

    // Get flag
    const challengeTrackerId = Object.entries(game.user.data.flags[ChallengeTrackerSettings.id]).find(ct => ct[1].title === challengeTrackerTitle)[0]
    if (challengeTrackerId) {
      const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId)
      if (flagData) return flagData
    }

    // Update challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle)
    if (challengeTracker) {
      return challengeTracker.challengeTrackerOptions
    }

    ui.notifications.error(game.i18n.format('challengeTracker.errors.doesNotExist', { value: challengeTrackerTitle }))
    return null
  }

  /**
  * Validate Challenge Tracker options
  * @param {array} [challengeTrackerOptions] Challenge Tracker Options
  * @param {string} challengeTrackerOptions.backgroundImage Background image link
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.foregroundImage Foreground image link
  * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {string} challengeTrackerOptions.ownerId Owner of the challenge tracker
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  */
  static validateOptions (challengeTrackerOptions) {
    const schema = ChallengeTrackerSettings.schema
    const validate = (challengeTrackerOptions, schema) =>
      Object.keys(challengeTrackerOptions)
        .filter(key => !schema.includes(key))
        .map(key => key)
    const errors = validate(challengeTrackerOptions, schema)

    if (errors.length > 0) {
      for (const key of errors) {
        let fuzzyQuery = ''
        const fuzzyResult = Utils.fuzzyMatch(key, schema)
        if (fuzzyResult) fuzzyQuery = ` ${game.i18n.format('challengeTracker.labels.fuzzyQuery', { fuzzyResult })}`
        ui.notifications.error(`${game.i18n.format('challengeTracker.errors.notValid', { parameter: key })}${fuzzyQuery}`)
      }
      return false
    }
    return true
  }
}
