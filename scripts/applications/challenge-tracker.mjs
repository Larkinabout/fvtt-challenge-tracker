import { MODULE, SCHEMA, DEFAULTS, TEMPLATES } from "../main/constants.mjs";
import { Utils } from "../main/utils.mjs";
import { ChallengeTrackerFlag } from "../main/flags.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ChallengeTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(
    challengeTrackerOptions,
    options,
    ownerId = null,
    executorId = null
  ) {
    super(options);
    this.elements = {};
    this.ownerId = ownerId;
    this.executorId = executorId;
    this._disable_popout_module = true; // Disable the PopOut! module on this application

    // Challenge Tracker Options
    if ( challengeTrackerOptions === undefined ) {
      challengeTrackerOptions = {
        backgroundImage: null,
        closeFunction: null,
        frameColor: null,
        frameWidth: null,
        id: null,
        foregroundImage: null,
        innerBackgroundColor: null,
        innerColor: null,
        innerCurrent: DEFAULTS.innerCurrent,
        innerTotal: DEFAULTS.innerTotal,
        listPosition: null,
        openFunction: null,
        outerBackgroundColor: null,
        outerColor: null,
        outerCurrent: DEFAULTS.outerCurrent,
        outerTotal: DEFAULTS.outerTotal,
        persist: DEFAULTS.persist,
        position: DEFAULTS.position,
        scroll: DEFAULTS.scroll,
        show: DEFAULTS.show,
        size: null,
        title: game.i18n.localize(DEFAULTS.title),
        windowed: null
      };
    }
    this.challengeTrackerOptions = challengeTrackerOptions;
    this.challengeTrackerOptions.ownerId = ownerId;
    this.challengeTrackerOptions.show = [true, false].includes(challengeTrackerOptions.show)
      ? challengeTrackerOptions.show
      : false;
    this.challengeTrackerOptions.outerTotal = challengeTrackerOptions.outerTotal ?? DEFAULTS.outerTotal;
    this.challengeTrackerOptions.innerTotal = challengeTrackerOptions.innerTotal ?? DEFAULTS.innerTotal;
    this.challengeTrackerOptions.outerCurrent = challengeTrackerOptions.outerCurrent ?? DEFAULTS.outerCurrent;
    this.challengeTrackerOptions.innerCurrent = challengeTrackerOptions.innerCurrent ?? DEFAULTS.innerCurrent;
    this.challengeTrackerOptions.outerColor = challengeTrackerOptions.outerColor ?? null;
    this.challengeTrackerOptions.outerBackgroundColor = challengeTrackerOptions.outerBackgroundColor ?? null;
    this.challengeTrackerOptions.innerColor = challengeTrackerOptions.innerColor ?? null;
    this.challengeTrackerOptions.innerBackgroundColor = challengeTrackerOptions.innerBackgroundColor ?? null;
    this.challengeTrackerOptions.frameColor = challengeTrackerOptions.frameColor ?? null;
    this.challengeTrackerOptions.frameWidth = challengeTrackerOptions.frameWidth ?? null;
    this.challengeTrackerOptions.position = challengeTrackerOptions.position ?? null;
    this.challengeTrackerOptions.scroll = challengeTrackerOptions.scroll ?? null;
    this.challengeTrackerOptions.size = challengeTrackerOptions.size ?? null;
    this.challengeTrackerOptions.windowed = [true, false].includes(challengeTrackerOptions.windowed)
      ? challengeTrackerOptions.windowed
      : null;
    this.challengeTrackerOptions.persist = [true, false].includes(challengeTrackerOptions.persist)
      ? challengeTrackerOptions.persist
      : false;

    // Local Options
    this.frameColor = null;
    this.frameColorHighlight1 = null;
    this.frameColorHighlight2 = null;
    this.frameWidth = null;
    this.innerBackgroundColor = null;
    this.innerBackgroundColorShade = null;
    this.innerColor = null;
    this.innerColorShade = null;
    this.outerBackgroundColor = null;
    this.outerBackgroundColorShade = null;
    this.outerColor = null;
    this.outerColorShade = null;
    this.scroll = null;
    this.size = null;
    this.windowed = null;
    this.backgroundImage = new Image();
    this.foregroundImage = new Image();

    // Canvas
    this.elements.canvasFrame = undefined;
    this.contextFrame = undefined;
    this.innerArc = new Path2D();
    this.outerArc = new Path2D();

    // Events
    this.mousePosition = { x: 0, y: 0 };
    this.eventListenerController = new AbortController();
    this.eventListenerSignal = this.eventListenerController.signal;
    this.eventListenerControllerScroll = null;
    this.eventListenerSignalScroll = null;
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    classes: ["challenge-tracker-app"],
    window: {
      resizable: false,
      title: DEFAULTS.title
    }
  };

  /* -------------------------------------------- */

  static PARTS = {
    form: {
      template: TEMPLATES.challengeTracker
    }
  };

  /* -------------------------------------------- */

  /**
   * Set values from challengeTrackerOptions or module settings for local variables
   * @public
   */
  async setVariables() {
    this.frameWidth = this.challengeTrackerOptions.frameWidth
      ?? Utils.getSetting("frameWidth", DEFAULTS.frameWidth);
    this.scroll = this.challengeTrackerOptions.scroll
      ?? Utils.getSetting("scroll", DEFAULTS.scroll);
    this.updateScroll(this.scroll);
    this.size = this.challengeTrackerOptions.size
      ?? Utils.getSetting("size", DEFAULTS.size);
    this.windowed = this.challengeTrackerOptions.windowed
      ?? Utils.getSetting("windowed", DEFAULTS.windowed);

    if ( this.challengeTrackerOptions.foregroundImage
      && this.foregroundImage.src !== this.challengeTrackerOptions.foregroundImage ) {
      this.foregroundImage.src = this.challengeTrackerOptions.foregroundImage;
    }
    if ( this.challengeTrackerOptions.backgroundImage
      && this.backgroundImage.src !== this.challengeTrackerOptions.backgroundImage ) {
      this.backgroundImage.src = this.challengeTrackerOptions.backgroundImage;
    }
    await this._loadImages();

    // Base Colors
    this.outerBackgroundColor = (this.challengeTrackerOptions.outerBackgroundColor)
      ? this.challengeTrackerOptions.outerBackgroundColor
      : Utils.getSetting("outerBackgroundColor", DEFAULTS.outerBackgroundColor);
    this.outerColor = (this.challengeTrackerOptions.outerColor)
      ? this.challengeTrackerOptions.outerColor
      : Utils.getSetting("outerColor", DEFAULTS.outerColor);
    this.innerBackgroundColor = (this.challengeTrackerOptions.innerBackgroundColor)
      ? this.challengeTrackerOptions.innerBackgroundColor
      : Utils.getSetting("innerBackgroundColor", DEFAULTS.innerBackgroundColor);
    this.innerColor = (this.challengeTrackerOptions.innerColor)
      ? this.challengeTrackerOptions.innerColor
      : Utils.getSetting("innerColor", DEFAULTS.innerColor);
    this.frameColor = (this.challengeTrackerOptions.frameColor)
      ? this.challengeTrackerOptions.frameColor
      : Utils.getSetting("frameColor", DEFAULTS.frameColor);

    this.updateColor(
      this.outerBackgroundColor,
      this.outerColor,
      this.innerBackgroundColor,
      this.innerColor,
      this.frameColor
    );
  }

  /* -------------------------------------------- */

  /**
   * Load challenge tracker images
   * @private
   */
  async _loadImages() {
    let counter = 0;
    while (
      (
        (this.challengeTrackerOptions.foregroundImage && !this.foregroundImage.complete)
        || (this.challengeTrackerOptions.backgroundImage && !this.backgroundImage.complete)
      )
      && counter < 10
    ) {
      await Utils.sleep(1000);
      counter++;
    }
  }

  /* -------------------------------------------- */

  /**
   * Open a Challenge Tracker
   * @public
   * @param {number} outerTotal Number of segments for the outer ring
   * @param {number} innerTotal Number of segments for the inner circle
   * @param {Array} [challengeTrackerOptions] Challenge Tracker Options
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
   * @param {object} challengeTrackerOptions.position Position of the challenge tracker
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param arg1
   * @param arg2
   * @param arg3
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  static open(
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
      innerCurrent: DEFAULTS.innerCurrent,
      innerTotal: DEFAULTS.innerTotal,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: null,
      outerColor: null,
      outerCurrent: DEFAULTS.outerCurrent,
      outerTotal: DEFAULTS.outerTotal,
      ownerId: null,
      persist: DEFAULTS.persist,
      position: DEFAULTS.position,
      scroll: DEFAULTS.scroll,
      show: DEFAULTS.show,
      size: DEFAULTS.size,
      title: DEFAULTS.title,
      windowed: null
    };
    switch (arguments.length) {
      case 1:
        if ( typeof arg1 === "object" ) {
          challengeTrackerOptions = arg1;
        }
        if ( typeof arg1 === "number" ) {
          challengeTrackerOptions.outerTotal = arg1;
        }
        break;
      case 2:
        if ( typeof arg1 === "number" ) {
          challengeTrackerOptions.outerTotal = arg1;
        }
        if ( typeof arg2 === "object" ) {
          challengeTrackerOptions = arg2;
          challengeTrackerOptions.outerTotal = arg1;
        }
        if ( typeof arg2 === "number" ) {
          challengeTrackerOptions.innerTotal = arg2;
        }
        break;
      case 3:
        if ( typeof arg1 === "number" ) {
          challengeTrackerOptions.outerTotal = arg1;
        }
        if ( typeof arg2 === "number" ) {
          challengeTrackerOptions.innerTotal = arg2;
        }
        if ( typeof arg3 === "object" ) {
          challengeTrackerOptions = arg3;
          challengeTrackerOptions.outerTotal = arg1;
          challengeTrackerOptions.innerTotal = arg2;
        }
    }

    // Validate challengeTrackerOptions
    if ( !ChallengeTracker.validateOptions(challengeTrackerOptions) ) return;

    const ownerId = challengeTrackerOptions.ownerId ?? game.userId;
    const executorId = game.userId;

    // When user is not allowed to show challenge tracker to others, overwrite show to false
    const userRole = game.user.role;
    if ( !Utils.checkAllow(userRole) ) challengeTrackerOptions.show = false;

    // When id is included, attempt to merge options from flag
    if ( challengeTrackerOptions.id ) {
      const flag = ChallengeTrackerFlag.get(ownerId, challengeTrackerOptions.id);
      if ( flag ) {
        challengeTrackerOptions = foundry.utils.mergeObject(flag, challengeTrackerOptions);
      } else {
        ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerOptions.id }));
        return;
      }
    }

    // Set unique id for each Challenge Tracker
    challengeTrackerOptions.id = challengeTrackerOptions.id
      ?? `${MODULE.ID}-${Math.random().toString(16).slice(2)}`;

    // Set listPosition
    const flagLength = (game.user.flags[MODULE.ID])
      ? Object.keys(game.users.get(ownerId).flags[MODULE.ID]).length + 1
      : 1;

    challengeTrackerOptions.listPosition =
      challengeTrackerOptions.listPosition
      ?? flagLength;

    // Set title
    challengeTrackerOptions.title = challengeTrackerOptions.title ?? game.i18n.localize(DEFAULTS.title);

    // Convert functions to string
    if ( challengeTrackerOptions.openFunction ) {
      const openFunction = Utils.functionToString(challengeTrackerOptions.openFunction);
      challengeTrackerOptions.openFunction = openFunction;
    }
    if ( challengeTrackerOptions.closeFunction ) {
      const closeFunction = Utils.functionToString(challengeTrackerOptions.closeFunction);
      challengeTrackerOptions.closeFunction = closeFunction;
    }

    // Call openHandler for only GM or everyone
    const options = {
      id: challengeTrackerOptions.id,
      window: {
        title: challengeTrackerOptions.title,
        width: challengeTrackerOptions.size
      }
    };
    if ( challengeTrackerOptions?.position?.left ) { options.left = challengeTrackerOptions?.position?.left; }
    if ( challengeTrackerOptions?.position?.top ) { options.top = challengeTrackerOptions?.position?.top; }

    if ( challengeTrackerOptions.show ) {
      ChallengeTrackerSocket.executeForEveryone(
        "openHandler",
        challengeTrackerOptions,
        options,
        ownerId,
        executorId

      );
    } else {
      ChallengeTracker.openHandler(
        challengeTrackerOptions,
        options,
        ownerId,
        executorId
      );
    }
  }

  /* -------------------------------------------- */

  /**
   * Open Challenge Tracker by id or open a new Challenge Tracker
   * @public
   * @param {Array} [challengeTrackerOptions] Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.position Position of the challenge tracker
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   * @param {Array} options id, template, title
   * @param {string} ownerId User that created the Challenge Tracker
   * @param {string} executorId User that executed the method
   **/
  static async openHandler(challengeTrackerOptions, options, ownerId, executorId) {
    const challengeTrackerId = options.id;

    // Convert openFunction back to function and execute
    if ( challengeTrackerOptions.openFunction ) {
      const openFunction = Utils.stringToFunction(challengeTrackerOptions.openFunction);
      if ( typeof openFunction === "function" ) {
        openFunction();
      }
    }

    // Add new Challenge Tracker or update client variables
    if ( !game.challengeTracker[challengeTrackerId] ) {
      await foundry.applications.handlebars.renderTemplate(TEMPLATES.challengeTracker);
      game.challengeTracker[challengeTrackerId] = new ChallengeTracker(
        challengeTrackerOptions,
        options,
        ownerId,
        executorId
      );
    } else {
      const challengeTracker = game.challengeTracker[challengeTrackerId];
      challengeTracker.challengeTrackerOptions = challengeTrackerOptions;
      // Switch the Show/Hide element for the owner
      if ( (game.user.isGM || game.userId === challengeTracker.ownerId)
        && game.userId !== executorId && !challengeTracker.challengeTrackerOptions.show ) {
        const show = true;
        challengeTracker.updateShowHideElement(show);
        return;
      }
    }

    // Render the Challenge Tracker
    game.challengeTracker[challengeTrackerId].render(true, { width: challengeTrackerOptions.size });
  }

  /* -------------------------------------------- */

  /**
   * Close all Challenge Trackers
   * @public
   * @param {string} [title=null] Title of the challenge tracker
   */
  static closeAll() {
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.close();
    }
  }

  /* -------------------------------------------- */

  /**
   * Close Challenge Tracker by title
   * @public
   * @param {string} [title=null] Title of the challenge tracker
   */
  static closeByTitle(title = null) {
    if ( !title ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "title", function: "ChallengeTracker.closeByTitle" }));
      return;
    }
    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.title === title);
    if ( challengeTracker ) challengeTracker.close();
  }

  /* -------------------------------------------- */

  /**
   * Close Challenge Tracker by id
   * @param {string} [id=null] Id of the challenge tracker
   */
  static closeById(id = null) {
    if ( !id ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTracker.closeById" }));
      return;
    }
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === id);
    if ( challengeTracker ) challengeTracker.close();
  }

  /* -------------------------------------------- */

  /**
   * Close Challenge Tracker via event of close method
   * @override
   */
  close(options = {}) {
    const socket = options.socket ?? false;
    if ( socket ) {
      super.close();
      return;
    }

    if ( !game.user.isGM && !Utils.checkUserId(this.ownerId) ) return;

    const executorId = game.userId;
    this.eventListenerController.abort();

    ChallengeTrackerSocket.executeForEveryone(
      "closeHandler",
      this.options,
      executorId
    );
  }

  /* -------------------------------------------- */

  /**
   * Close the Challenge Tracker by Id
   * @public
   * @param {Array} options id, template, title
   * @param {string} executorId User that executed the method
   **/
  static closeHandler(options, executorId) {
    const challengeTrackerId = options.id;

    if ( !game.challengeTracker ) return;
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.id === options.id);
    if ( !challengeTracker ) return;

    // Keep open for owner, instead switch the Show/Hide element
    if ( game.userId === challengeTracker.ownerId && executorId !== challengeTracker.ownerId ) {
      const show = false;
      challengeTracker.updateShowHideElement(show);
      return;
    }

    // Convert closeFunction back to function
    if ( challengeTracker.challengeTrackerOptions.closeFunction ) {
      const closeFunction = Utils.stringToFunction(challengeTracker.challengeTrackerOptions.closeFunction);
      if ( typeof closeFunction === "function" ) {
        closeFunction();
      }
    }
    const closeFunction = challengeTracker.challengeTrackerOptions.closeFunction;
    if ( typeof closeFunction === "function" ) closeFunction();

    challengeTracker.close({ socket: true });
    delete game.challengeTracker[challengeTrackerId];
  }

  /* -------------------------------------------- */

  async _onRender(context, options) {
    await super._onRender(context, options);

    const hasPermission = (game.user.isGM || Utils.checkUserId(this.ownerId));

    const windowHeader = this.element.querySelector(".window-header");
    const closeButton = windowHeader.querySelector('[data-action="close"]');

    // Update elements on window header
    if ( hasPermission ) {
      this.elements.showHideButton = windowHeader.querySelector("[data-action=\"show-hide\"]");

      if ( !this.elements.showHideButton ) {
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("class", "header-control icon fa-solid fa-eye");
        button.setAttribute("data-action", "show-hide");
        button.addEventListener("click", () => this._switchShowHide());
        windowHeader.insertBefore(button, closeButton);
        this.elements.showHideButton = button;
      }
      this.updateShowHideElement();
    }

    // Update elements on window header
    this.elements.dragButton = windowHeader.querySelector("[data-action=\"drag\"]");

    if ( !this.elements.dragButton ) {
      const button = document.createElement("button");
      button.setAttribute("type", "button");
      button.setAttribute("class", "header-control icon fa-solid fa-up-down-left-right");
      button.setAttribute("data-action", "drag");
      button.addEventListener("pointerdown", this.#onWindowDragStart.bind(this));
      windowHeader.insertBefore(button, closeButton);
      this.elements.dragButton = button;
    }

    // Remove the Close button for players
    if ( !hasPermission ) {
      closeButton.remove();
    }

    // Toggle class for windowless mode
    this.element.classList.toggle("windowless", !this.windowed);

    if ( hasPermission ) {
      this.elements.canvasFrame = this.element.querySelector("#challenge-tracker-canvas-frame");
      this.eventListenerController = new AbortController();
      this.eventListenerSignal = this.eventListenerController.signal;
      document.addEventListener("mousemove", event => this._mouseMoveEvent(event),
        { signal: this.eventListenerSignal }
      );
      document.addEventListener("keypress", event => this._keyPressEvent(event),
        { signal: this.eventListenerSignal }
      );
      this.elements.canvasFrame.addEventListener("click", event => this._clickEvent(event),
        { signal: this.eventListenerSignal }
      );
      this.elements.canvasFrame.addEventListener("contextmenu", event => this._contextMenuEvent(event),
        { signal: this.eventListenerSignal }
      );
      if ( this.scroll ) {
        if ( this.eventListenerSignalScroll == null || this.eventListenerSignalScroll.aborted ) {
          this.eventListenerControllerScroll = new AbortController();
          this.eventListenerSignalScroll = this.eventListenerControllerScroll.signal;
          document.addEventListener("wheel", event => this._wheelEvent(event),
            { signal: this.eventListenerSignalScroll }
          );
        }
      } else if ( this.eventListenerSignalScroll !== null && !this.eventListenerSignalScroll.aborted ) {
        this.eventListenerControllerScroll.abort();
      }
      const appElement = document.querySelector(`#${this.id}`);
      const windowHeaderElement = appElement?.querySelector(".window-header");
      windowHeaderElement.addEventListener("pointerdown", event => this._dragEvent(event));
    }
  }

  /* -------------------------------------------- */

  /**
   * Drag event
   * @private
   * @param {object} event
   */
  _dragEvent(event) {
    /**
     * Mouse up event handler
     * @param appElement
     */
    const mouseUpEvent = appElement => {
      const left = parseInt(appElement.style.left);
      const top = parseInt(appElement.style.top);

      ChallengeTrackerFlag.setPosition(this.id, { left, top });
    };

    document.onmouseup = mouseUpEvent(this.element);
  }

  /* -------------------------------------------- */

  /**
   * Begin capturing pointer events on the application frame.
   * @param {PointerEvent} event  The triggering event.
   * @param {Function} callback   The callback to attach to pointer move events.
   */
  #startPointerCapture(event, callback) {
    this.window.pointerStartPosition = Object.assign(foundry.utils.deepClone(this.position), {
      clientX: event.clientX, clientY: event.clientY
    });
    this.element.addEventListener("pointermove", callback, { passive: true });
    this.element.addEventListener("pointerup", event => this.#endPointerCapture(event, callback), {
      capture: true, once: true
    });
  }

  /* -------------------------------------------- */

  /**
   * End capturing pointer events on the application frame.
   * @param {PointerEvent} event  The triggering event.
   * @param {Function} callback   The callback to remove from pointer move events.
   */
  #endPointerCapture(event, callback) {
    this.element.releasePointerCapture(event.pointerId);
    this.element.removeEventListener("pointermove", callback);
    delete this.window.pointerStartPosition;
    this.window.pointerMoveThrottle = false;
  }

  /* -------------------------------------------- */

  /**
   * Begin dragging the Application position.
   * @param {PointerEvent} event
   */
  #onWindowDragStart(event) {
    this.#endPointerCapture(event, this.window.onDrag);
    this.#startPointerCapture(event, this.window.onDrag);
  }

  /* -------------------------------------------- */

  /**
   * Set mouse position on mouse move event
   * @private
   * @param {object} event Listener event
   **/
  _mouseMoveEvent(event) {
    this.mousePosition.x = event.pageX;
    this.mousePosition.y = event.pageY;
    if ( this.contextFrame?.isPointInPath(this.outerArc, event.offsetX, event.offsetY) ) {
      this.elements.canvasFrame.style.cursor = "pointer";
    } else {
      this.elements.canvasFrame.style.cursor = "default";
    }
  }

  /* -------------------------------------------- */

  /**
   * Increase current segments on mouse left-click
   * @private
   * @param {object} event Listener event
   **/
  _clickEvent(event) {
    if ( this.challengeTrackerOptions.innerTotal > 0
      && this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY) ) {
      this.challengeTrackerOptions.innerCurrent = (
        this.challengeTrackerOptions.innerCurrent === this.challengeTrackerOptions.innerTotal
      ) ? this.challengeTrackerOptions.innerTotal
        : this.challengeTrackerOptions.innerCurrent + 1;
      this._draw();
    } else if ( this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY) ) {
      this.challengeTrackerOptions.outerCurrent = (
        this.challengeTrackerOptions.outerCurrent === this.challengeTrackerOptions.outerTotal
      ) ? this.challengeTrackerOptions.outerTotal
        : this.challengeTrackerOptions.outerCurrent + 1;
      this._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Decrease current segments on mouse right-click
   * @private
   * @param {object} event Listener event
   **/
  _contextMenuEvent(event) {
    if ( this.challengeTrackerOptions.innerTotal > 0
      && this.contextFrame.isPointInPath(this.innerArc, event.offsetX, event.offsetY) ) {
      event.preventDefault();
      this.challengeTrackerOptions.innerCurrent = (this.challengeTrackerOptions.innerCurrent === 0)
        ? this.challengeTrackerOptions.innerTotal
        : this.challengeTrackerOptions.innerCurrent - 1;
      this._draw();
    } else if ( this.contextFrame.isPointInPath(this.outerArc, event.offsetX, event.offsetY) ) {
      event.preventDefault();
      this.challengeTrackerOptions.outerCurrent = (this.challengeTrackerOptions.outerCurrent === 0)
        ? this.challengeTrackerOptions.outerTotal
        : this.challengeTrackerOptions.outerCurrent - 1;
      this._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Increase/decrease total segments on +/- key press
   * @private
   * @param {object} event Listener event
   **/
  _keyPressEvent(event) {
    const rect = this.elements.canvasFrame.getBoundingClientRect();
    const x = this.mousePosition.x - rect.left;
    const y = this.mousePosition.y - rect.top;
    if ( this.challengeTrackerOptions.innerTotal > 0 && this.contextFrame.isPointInPath(this.innerArc, x, y) ) {
      if ( event.code === "Minus" ) {
        if ( this.challengeTrackerOptions.innerTotal > 1 ) this.challengeTrackerOptions.innerTotal--;
        this.challengeTrackerOptions.innerCurrent =
          (this.challengeTrackerOptions.innerCurrent > this.challengeTrackerOptions.innerTotal)
            ? this.challengeTrackerOptions.innerTotal
            : this.challengeTrackerOptions.innerCurrent;
        this._draw();
      }
      if ( event.code === "Equal" ) {
        this.challengeTrackerOptions.innerTotal++;
        this._draw();
      }
    } else if ( this.contextFrame.isPointInPath(this.outerArc, x, y) ) {
      if ( event.code === "Minus" ) {
        if ( this.challengeTrackerOptions.outerTotal > 1 ) this.challengeTrackerOptions.outerTotal--;
        this._draw();
      }
      if ( event.code === "Equal" ) {
        this.challengeTrackerOptions.outerTotal++;
        this._draw();
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Increase/decrease total segments on scroll
   * @private
   * @param {object} event Listener event
   **/
  _wheelEvent(event) {
    const rect = this.elements.canvasFrame.getBoundingClientRect();
    const x = this.mousePosition.x - rect.left;
    const y = this.mousePosition.y - rect.top;
    if ( this.challengeTrackerOptions.innerTotal > 0 && this.contextFrame.isPointInPath(this.innerArc, x, y) ) {
      if ( event.deltaY > 0 ) {
        if ( this.challengeTrackerOptions.innerTotal > 1 ) this.challengeTrackerOptions.innerTotal--;
        this.challengeTrackerOptions.innerCurrent =
          (this.challengeTrackerOptions.innerCurrent > this.challengeTrackerOptions.innerTotal)
            ? this.challengeTrackerOptions.innerTotal
            : this.challengeTrackerOptions.innerCurrent;
      }
      if ( event.deltaY < 0 ) {
        this.challengeTrackerOptions.innerTotal++;
      }
      this._draw();
    } else if ( this.contextFrame.isPointInPath(this.outerArc, x, y) ) {
      if ( event.deltaY > 0 ) {
        if ( this.challengeTrackerOptions.outerTotal > 1 ) this.challengeTrackerOptions.outerTotal--;
        this.challengeTrackerOptions.outerCurrent = (
          this.challengeTrackerOptions.outerCurrent > this.challengeTrackerOptions.outerTota
        ) ? this.challengeTrackerOptions.outerTotal
          : this.challengeTrackerOptions.outerCurrent;
      }
      if ( event.deltaY < 0 ) {
        this.challengeTrackerOptions.outerTotal++;
      }
      this._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Draw Challenge Tracker by Id
   * @public
   * @param {Array} [challengeTrackerOptions=null] Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  async draw(challengeTrackerOptions = null) {
    if ( challengeTrackerOptions ) this.challengeTrackerOptions = challengeTrackerOptions;
    this.updateShowHide();
    this._draw();
  }

  /* -------------------------------------------- */

  /**
   * Draw the challenge tracker
   * @private
   */
  _draw() {
    // Call drawHandler for executor only or everyone
    const isExecutor = Utils.checkUserId(this.executorId);
    if ( isExecutor && this.challengeTrackerOptions.show ) {
      ChallengeTrackerSocket.executeForEveryone(
        "drawHandler",
        this.challengeTrackerOptions,
        this.options
      );
    } else {
      ChallengeTracker.drawHandler(
        this.challengeTrackerOptions,
        this.options
      );
    }
    if ( isExecutor && this.challengeTrackerOptions.persist ) {
      ChallengeTrackerFlag.set(this.ownerId, this.challengeTrackerOptions);
    }
  }

  /* -------------------------------------------- */

  /**
   * Draw Challenge Tracker by ID
   * @public
   * @param {Array} challengeTrackerOptions Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   * @param {Array} options id, template, title
   **/
  static async drawHandler(challengeTrackerOptions, options) {
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.id === options.id);
    if ( !challengeTracker || !challengeTracker.element ) return;
    await challengeTracker.setVariables();
    challengeTracker.drawCanvas(challengeTrackerOptions);
    if ( challengeTrackerOptions.windowed ) {
      challengeTracker.element.classList.remove("windowless");
    } else {
      challengeTracker.element.classList.add("windowless");
    }
  }

  /* -------------------------------------------- */

  /**
   * Draw the Challenge Tracker canvas
   * @public
   * @param {Array} challengeTrackerOptions Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  drawCanvas(challengeTrackerOptions) {
    // Set variables
    this.challengeTrackerOptions = challengeTrackerOptions;
    const canvasSize = this.size;
    const halfCanvasSize = canvasSize / 2;
    let lineWidth;
    switch (this.frameWidth) {
      case "extra-thin":
        lineWidth = 1;
        break;
      case "thin":
        lineWidth = Math.round(canvasSize / 40);
        break;
      case "medium":
        lineWidth = Math.round(canvasSize / 30);
        break;
      case "thick":
        lineWidth = Math.round(canvasSize / 20);
        break;
      case "none":
        lineWidth = 0;
        break;
      default:
        lineWidth = Math.round(canvasSize / 30);
    }
    const lineWidthForRadius = (lineWidth === 0) ? Math.round(canvasSize / 40) : lineWidth * 2;
    const halfLineWidth = (lineWidth === 0) ? 0 : lineWidth / 1.5;
    const radius = halfCanvasSize - lineWidthForRadius;
    this.position.width = canvasSize;
    this.position.height = "auto";

    this.elements.windowTitle = this.element.querySelector(".window-title");
    const wrapper = this.element.querySelector("#challenge-tracker-wrapper");

    this.elements.canvasFrame = this.element.querySelector("#challenge-tracker-canvas-frame");
    this.contextFrame = this.elements.canvasFrame.getContext("2d");

    const canvas = this.element.querySelector("#challenge-tracker-canvas");
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";

    const canvasImage = this.element.querySelector("#challenge-tracker-canvas-image");
    const contextImage = canvasImage.getContext("2d");
    contextImage.imageSmoothingQuality = "high";

    this.element.style.width = `${canvasSize}px`;
    this.element.style.height = "auto";
    this.elements.windowTitle.dataset.tooltip = challengeTrackerOptions.title;
    wrapper.style.width = `${canvasSize}px`;
    wrapper.style.height = `${canvasSize}px`;
    this.elements.canvasFrame.setAttribute("height", canvasSize);
    this.elements.canvasFrame.setAttribute("width", canvasSize);
    canvas.setAttribute("height", canvasSize);
    canvas.setAttribute("width", canvasSize);
    canvasImage.setAttribute("height", canvasSize);
    canvasImage.setAttribute("width", canvasSize);
    this.innerArc = new Path2D();
    this.outerArc = new Path2D();

    const outerRemaining = this.challengeTrackerOptions.outerTotal - this.challengeTrackerOptions.outerCurrent;
    const innerRemaining = this.challengeTrackerOptions.innerTotal - this.challengeTrackerOptions.innerCurrent;
    const outerSliceRadians = (360 / this.challengeTrackerOptions.outerTotal) * Math.PI / 180;
    const innerSliceRadians = (360 / this.challengeTrackerOptions.innerTotal) * Math.PI / 180;
    const startAngle = 1.5 * Math.PI;
    const outerEndAngle = (outerSliceRadians * this.challengeTrackerOptions.outerCurrent) + 1.5 * Math.PI;
    const innerEndAngle = (innerSliceRadians * this.challengeTrackerOptions.innerCurrent) + 1.5 * Math.PI;

    // IMAGE CANVAS

    // Clear drawing on canvas image element
    contextImage.clearRect(0, 0, canvasSize, canvasSize);

    // DRAW FOREGROUND IMAGE
    if ( this.challengeTrackerOptions.foregroundImage ) {
      if ( this.challengeTrackerOptions.outerCurrent > 0 ) {
        contextImage.beginPath();
        contextImage.moveTo(halfCanvasSize, halfCanvasSize);
        contextImage.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle);
        contextImage.fillStyle = "rgba(0, 0, 0, 1)";
        contextImage.fill();
        contextImage.closePath();
      }
      if ( this.challengeTrackerOptions.innerTotal > 0 ) {
        // Remove centre of outer ring for the inner circle
        contextImage.save();
        contextImage.beginPath();
        contextImage.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI);
        contextImage.globalCompositeOperation = "destination-out";
        contextImage.fillStyle = "rgba(0, 0, 0, 1)";
        contextImage.fill();
        contextImage.closePath();
        contextImage.restore();
      }
      if ( this.challengeTrackerOptions.innerCurrent > 0 ) {
        contextImage.beginPath();
        contextImage.moveTo(halfCanvasSize, halfCanvasSize);
        contextImage.arc(
          halfCanvasSize,
          halfCanvasSize,
          radius / 5 * 3,
          startAngle,
          innerEndAngle
        );
        contextImage.fillStyle = "rgba(0, 0, 0, 1)";
        contextImage.fill();
        contextImage.closePath();
      }
      contextImage.globalCompositeOperation = "source-in";
      contextImage.drawImage(
        this.foregroundImage,
        lineWidthForRadius,
        lineWidthForRadius,
        canvasSize - (lineWidthForRadius * 2),
        canvasSize - (lineWidthForRadius * 2)
      );
    }

    // DRAW BACKGROUND IMAGE
    if ( this.challengeTrackerOptions.backgroundImage ) {
      contextImage.globalCompositeOperation = "destination-over";
      contextImage.drawImage(
        this.backgroundImage,
        lineWidthForRadius,
        lineWidthForRadius,
        canvasSize - (lineWidthForRadius * 2),
        canvasSize - (lineWidthForRadius * 2)
      );
    }

    // CANVAS

    // Clear drawing on background canvas element
    context.clearRect(0, 0, canvasSize, canvasSize);

    // Set outer ring background gradient
    const outerBackgroundGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3,
      halfCanvasSize,
      halfCanvasSize,
      radius
    );
    outerBackgroundGradient.addColorStop(0, this.outerBackgroundColor);
    outerBackgroundGradient.addColorStop(1, this.outerBackgroundColorShade);

    // Draw outer ring background
    if ( outerRemaining > 0 ) {
      context.beginPath();
      context.moveTo(halfCanvasSize, halfCanvasSize);
      if ( outerRemaining === this.challengeTrackerOptions.outerTotal ) {
        context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, -0.5 * Math.PI, true);
      } else {
        context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle, true);
      }
      context.fillStyle = outerBackgroundGradient;
      context.fill();
      context.closePath();
    }
    // Set outer ring gradient
    const outerGradient = context.createRadialGradient(
      halfCanvasSize,
      halfCanvasSize,
      radius / 5 * 3,
      halfCanvasSize,
      halfCanvasSize,
      radius
    );
    outerGradient.addColorStop(0, this.outerColor);
    outerGradient.addColorStop(1, this.outerColorShade);

    // Draw outer ring current arc
    if ( this.challengeTrackerOptions.outerCurrent > 0 ) {
      context.beginPath();
      context.moveTo(halfCanvasSize, halfCanvasSize);
      context.arc(halfCanvasSize, halfCanvasSize, radius, startAngle, outerEndAngle);
      context.fillStyle = outerGradient;
      context.fill();
      context.closePath();
    }

    if ( this.challengeTrackerOptions.innerTotal > 0 ) {
      // Remove centre of outer ring for the inner circle
      context.save();
      context.beginPath();
      context.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI);
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fill();
      context.closePath();
      context.restore();

      // Set inner circle background gradient
      const innerBackgroundGradient = context.createRadialGradient(
        halfCanvasSize,
        halfCanvasSize,
        0,
        halfCanvasSize,
        halfCanvasSize,
        radius / 5 * 3
      );
      innerBackgroundGradient.addColorStop(0, this.innerBackgroundColor);
      innerBackgroundGradient.addColorStop(1, this.innerBackgroundColorShade);

      // Draw inner circle background
      if ( innerRemaining > 0 ) {
        context.beginPath();
        context.moveTo(halfCanvasSize, halfCanvasSize);
        if ( innerRemaining === this.challengeTrackerOptions.innerTotal ) {
          context.arc(
            halfCanvasSize,
            halfCanvasSize,
            radius / 5 * 3,
            startAngle,
            -0.5 * Math.PI,
            true
          );
        } else {
          context.arc(
            halfCanvasSize,
            halfCanvasSize,
            radius / 5 * 3,
            startAngle,
            innerEndAngle,
            true
          );
        }
        context.fillStyle = innerBackgroundGradient;
        context.fill();
        context.closePath();
      }

      // Set inner circle gradient
      const innerGradient = context.createRadialGradient(
        halfCanvasSize,
        halfCanvasSize,
        0,
        halfCanvasSize,
        halfCanvasSize,
        radius / 5 * 3
      );
      innerGradient.addColorStop(0, this.innerColor);
      innerGradient.addColorStop(1, this.innerColorShade);

      // Draw inner circle current arc
      if ( this.challengeTrackerOptions.innerCurrent > 0 ) {
        context.beginPath();
        context.moveTo(halfCanvasSize, halfCanvasSize);
        context.arc(
          halfCanvasSize,
          halfCanvasSize,
          radius / 5 * 3,
          startAngle,
          innerEndAngle
        );
        context.fillStyle = innerGradient;
        context.fill();
        context.closePath();
      }
    }

    // FRAME CANVAS

    // Clear drawing on canvasFrame element
    this.contextFrame.clearRect(0, 0, canvasSize, canvasSize);

    if ( lineWidth !== 0 ) {
    // Draw frame
      this.contextFrame.beginPath();
      this.contextFrame.shadowOffsetX = halfLineWidth / 2;
      this.contextFrame.shadowOffsetY = halfLineWidth / 2;
      this.contextFrame.shadowColor = "rgba(0, 0, 0, 0.5)";
      this.contextFrame.shadowBlur = halfLineWidth;

      // Draw lines between segments of outer ring
      this.contextFrame.save();
      this.contextFrame.translate(halfCanvasSize, halfCanvasSize);
      this.contextFrame.rotate(outerSliceRadians * this.challengeTrackerOptions.outerTotal / 2);
      if ( this.challengeTrackerOptions.outerTotal > 1 ) {
        for (let outerSlice = 1; outerSlice <= this.challengeTrackerOptions.outerTotal; outerSlice++) {
          if ( outerSlice > 1 ) this.contextFrame.rotate(outerSliceRadians);
          if ( this.challengeTrackerOptions.innerTotal > 0 ) {
            this.contextFrame.moveTo(0, radius / 5 * 3);
          } else {
            this.contextFrame.moveTo(0, 0);
          }
          this.contextFrame.lineTo(0, radius);
        }
      }
      this.contextFrame.restore();

      if ( this.challengeTrackerOptions.innerTotal > 0 ) {
      // Draw lines between segments of inner circle
        this.contextFrame.save();
        this.contextFrame.translate(halfCanvasSize, halfCanvasSize);
        this.contextFrame.rotate(innerSliceRadians * this.challengeTrackerOptions.innerTotal / 2);
        if ( this.challengeTrackerOptions.innerTotal > 1 ) {
          for (let innerSlice = 1; innerSlice <= this.challengeTrackerOptions.innerTotal; innerSlice++) {
            if ( innerSlice > 1 ) this.contextFrame.rotate(innerSliceRadians);
            this.contextFrame.moveTo(0, 0);
            this.contextFrame.lineTo(0, radius / 5 * 3);
          }
        }
        this.contextFrame.restore();
      }

      // Stroke lines
      this.contextFrame.strokeStyle = this.frameColor;
      this.contextFrame.lineWidth = halfLineWidth;
      this.contextFrame.stroke();
      this.contextFrame.closePath();
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
    );
    outerFrameGradient.addColorStop(0, this.frameColorHighlight2);
    outerFrameGradient.addColorStop(0.1, this.frameColorHighlight1);
    outerFrameGradient.addColorStop(0.3, this.frameColor);
    outerFrameGradient.addColorStop(0.7, this.frameColor);
    outerFrameGradient.addColorStop(0.9, this.frameColorHighlight1);
    outerFrameGradient.addColorStop(1, this.frameColorHighlight2);
    this.contextFrame.beginPath();
    this.contextFrame.strokeStyle = outerFrameGradient;
    this.contextFrame.lineWidth = lineWidth;
    this.outerArc.arc(halfCanvasSize, halfCanvasSize, radius, 0, 2 * Math.PI);
    this.contextFrame.stroke(this.outerArc);
    this.contextFrame.closePath();

    if ( this.challengeTrackerOptions.innerTotal > 0 ) {
      const innerFrameGradient = context.createRadialGradient(
        halfCanvasSize + (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        (radius / 5 * 3) - halfLineWidth - (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        halfCanvasSize + (halfLineWidth / 4),
        (radius / 5 * 3) + halfLineWidth + (halfLineWidth / 4)
      );
      innerFrameGradient.addColorStop(0, this.frameColorHighlight2);
      innerFrameGradient.addColorStop(0.1, this.frameColorHighlight1);
      innerFrameGradient.addColorStop(0.3, this.frameColor);
      innerFrameGradient.addColorStop(0.7, this.frameColor);
      innerFrameGradient.addColorStop(0.9, this.frameColorHighlight1);
      innerFrameGradient.addColorStop(1, this.frameColorHighlight2);
      this.contextFrame.beginPath();
      this.contextFrame.strokeStyle = innerFrameGradient;
      this.contextFrame.lineWidth = lineWidth;
      this.innerArc.arc(halfCanvasSize, halfCanvasSize, radius / 5 * 3, 0, 2 * Math.PI);
      this.contextFrame.stroke(this.innerArc);
      this.contextFrame.closePath();
    }
  }

  /* -------------------------------------------- */

  /**
   * Set colors and draw all Challenge Trackers based on the module settings
   * @public
   * @param {string} outerBackgroundColor Hex color for the outer ring background
   * @param {string} outerColor Hex color for the outer ring
   * @param {string} innerBackgroundColor Hex color for the inner circle
   * @param {string} innerColor Hex color for the inner circle
   * @param {string} frameColor Hex color for the frame
   **/
  static updateColorAndDraw(outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor) {
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.updateColor(outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor);
      challengeTracker._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Update colors on all Challenge Trackers based on options or the module settings
   * @public
   * @param {string} outerBackgroundColor Hex color for the outer ring background
   * @param {string} outerColor Hex color for the outer ring
   * @param {string} innerBackgroundColor Hex color for the inner circle background
   * @param {string} innerColor Hex color for the inner circle
   * @param {string} frameColor Hex color for the frame
   **/
  updateColor(outerBackgroundColor, outerColor, innerBackgroundColor, innerColor, frameColor) {
    this.outerBackgroundColor = (this.challengeTrackerOptions.outerBackgroundColor)
      ? this.challengeTrackerOptions.outerBackgroundColor
      : outerBackgroundColor;
    this.outerColor = (this.challengeTrackerOptions.outerColor)
      ? this.challengeTrackerOptions.outerColor
      : outerColor;
    this.innerBackgroundColor = (this.challengeTrackerOptions.innerBackgroundColor)
      ? this.challengeTrackerOptions.innerBackgroundColor
      : innerBackgroundColor;
    this.innerColor = (this.challengeTrackerOptions.innerColor)
      ? this.challengeTrackerOptions.innerColor
      : innerColor;
    this.frameColor = this.frameColor = (this.challengeTrackerOptions.frameColor)
      ? this.challengeTrackerOptions.frameColor
      : frameColor;
    this.outerColorShade = Utils.shadeColor(this.outerColor, 1.25);
    this.innerColorShade = Utils.shadeColor(this.innerColor, 1.25);
    this.outerBackgroundColorShade = Utils.shadeColor(this.outerBackgroundColor, 1.25);
    this.innerBackgroundColorShade = Utils.shadeColor(this.innerBackgroundColor, 1.25);
    this.frameColorHighlight1 = Utils.shadeColor(this.frameColor, 1);
    this.frameColorHighlight2 = Utils.shadeColor(this.frameColor, 1);
  }

  /* -------------------------------------------- */

  /**
   * Set frame width on all Challenge Trackers based on the module setting
   * @public
   * @param {string} frameWidth thin, medium, thick
   **/
  static updateFrameWidth(frameWidth) {
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.frameWidth = challengeTracker.challengeTrackerOptions.frameWidth ?? frameWidth;
      challengeTracker._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Update size of all Challenge Trackers based on the module setting
   * @public
   * @param {number} size Size of the Challenge Tracker in pixels
   **/
  static updateSize(size) {
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.size = challengeTracker.challengeTrackerOptions.size ?? size;
      challengeTracker.updateShowHideElement();
      challengeTracker._draw();
    }
  }

  /* -------------------------------------------- */

  /**
   * Update window visibility of all Challenge Trackers based on the module setting
   * @public
   * @param {boolean} windowed true = Windowed, false = Windowless
   **/
  static updateWindowed(windowed) {
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if ( [true, false].includes(challengeTracker.challengeTrackerOptions.windowed) ) return;

      this.element.classList.toggle("windowless", !windowed);
    }
  }

  /* -------------------------------------------- */

  /**
   * Enable/disable scroll wheel event on all Challenge Trackers based on the module setting
   * @public
   * @param {boolean} scroll Enable (true) or disable (false) the scroll wheel event
   **/
  updateScroll(scroll) {
    if ( !game.challengeTracker ) return;
    for (const challengeTracker of Object.values(game.challengeTracker)) {
      challengeTracker.scroll = challengeTracker.challengeTrackerOptions.scroll ?? scroll;
      if ( challengeTracker.scroll ) {
        if ( challengeTracker.eventListenerSignalScroll == null
          || challengeTracker.eventListenerSignalScroll.aborted ) {
          challengeTracker.eventListenerControllerScroll = new AbortController();
          challengeTracker.eventListenerSignalScroll = challengeTracker.eventListenerControllerScroll.signal;
          document.addEventListener("wheel", event => challengeTracker._wheelEvent(event),
            { signal: challengeTracker.eventListenerSignalScroll }
          );
        }
      } else if ( challengeTracker.eventListenerSignalScroll !== null
        && !challengeTracker.eventListenerSignalScroll.aborted ) {
        challengeTracker.eventListenerControllerScroll.abort();
      }
    }
  }

  /* -------------------------------------------- */

  getShowHideIcon(show = this.challengeTrackerOptions.show) {
    return show
      ? "fa-eye"
      : "fa-eye-slash";
  }

  /* -------------------------------------------- */

  getShowHideTooltip(show = this.challengeTrackerOptions.show) {
    return show
      ? game.i18n.localize("challengeTracker.labels.showTracker")
      : game.i18n.localize("challengeTracker.labels.hideTracker");
  }

  /* -------------------------------------------- */

  /**
   * Update the Show/Hide element of the Challenge Tracker
   * @public
   * @param {boolean} show true = Show, false = Hide
   **/
  updateShowHideElement(show = this.challengeTrackerOptions.show) {
    if ( !Utils.checkAllow(game.user.role) ) return;
    this.challengeTrackerOptions.show = show;
    const showHideButton = this.elements.showHideButton;
    const tooltip = this.getShowHideTooltip(show);
    showHideButton.setAttribute("data-tooltip", tooltip);
    showHideButton.setAttribute("aria-label", tooltip);
    showHideButton.classList.remove(this.getShowHideIcon(!show));
    showHideButton.classList.add(this.getShowHideIcon(show));
  }

  /* -------------------------------------------- */

  /**
   * Show/hide the Challenge Tracker for others
   * @public
   * @param {string} [executorId=null] The executor id
   */
  updateShowHide(executorId = null) {
    const isExecutor = Utils.checkUserId(executorId ?? this.executorId);

    if ( isExecutor && this.challengeTrackerOptions.show ) {
      ChallengeTrackerSocket.executeForOthers(
        "openHandler",
        this.challengeTrackerOptions,
        this.options,
        executorId
      );
    } else {
      ChallengeTrackerSocket.executeForOthers(
        "closeHandler",
        this.options,
        executorId
      );
    }

    this.updateShowHideElement();
    ChallengeTrackerFlag.set(this.ownerId, this.challengeTrackerOptions);
  }

  /* -------------------------------------------- */

  /**
   * Switch the challengeTrackerOptions.show value
   * @private
   */
  _switchShowHide() {
    this.challengeTrackerOptions.show = !(this.challengeTrackerOptions.show);
    this.updateShowHide(game.userId);
  }

  /* -------------------------------------------- */

  /**
   * Show all Challenge Trackers
   * @public
   **/
  static showAll() {
    const userRole = game.user.role;
    if ( !game.user.isGM && !Utils.checkAllow(userRole) ) return;
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if ( game.user.isGM || Utils.checkUserId(challengeTracker.ownerId) ) challengeTracker.showHandler(game.userId);
    }
  }

  /* -------------------------------------------- */

  /**
   * Show Challenge Tracker by ID
   * @public
   * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
   **/
  static showById(challengeTrackerId = null) {
    if ( !challengeTrackerId ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTracker.showById" }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkAllow(game.user.role) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notAllowed", { function: "ChallengeTracker.showById" }));
      return;
    }

    if ( !game.challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
      return;
    }

    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);

    if ( !challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notOwned", { value: challengeTrackerId }));
      return;
    }

    const executorId = game.userId;
    challengeTracker.showHandler(executorId);
  }

  /* -------------------------------------------- */

  /**
   * Show Challenge Tracker by title
   * @public
   * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
   **/
  static showByTitle(challengeTrackerTitle = null) {
    if ( !challengeTrackerTitle ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "title", function: "ChallengeTracker.showByTitle" }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkAllow(game.user.role) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notAllowed", { function: "ChallengeTracker.showByTitle" }));
      return;
    }

    if ( !game.challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerTitle }));
      return;
    }

    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle);

    if ( !challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerTitle }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notOwned", { value: challengeTrackerTitle }));
      return;
    }

    const executorId = game.userId;
    challengeTracker.showHandler(executorId);
  }

  /* -------------------------------------------- */

  showHandler(executorId) {
    this.challengeTrackerOptions.show = true;
    this.updateShowHide(executorId);
  }

  /* -------------------------------------------- */

  /**
   * Hide all Challenge Trackers
   * @public
   **/
  static hideAll() {
    if ( !game.user.isGM && !Utils.checkAllow(game.user.role) ) return;
    if ( !game.challengeTracker ) return;

    for (const challengeTracker of Object.values(game.challengeTracker)) {
      if ( game.user.isGM || Utils.checkUserId(challengeTracker.ownerId) ) challengeTracker.hideHandler(game.userId);
    }
  }

  /* -------------------------------------------- */

  /**
   * Hide Challenge Tracker by ID
   * @public
   * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
   **/
  static hideById(challengeTrackerId = null) {
    if ( !challengeTrackerId ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTracker.hideById" }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkAllow(game.user.role) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notAllowed", { function: "ChallengeTracker.hideById" }));
      return;
    }

    if ( !game.challengeTracker ) {
      ui.notifications.error(`Challenge Tracker '${challengeTrackerId}' does not exist.`);
      return;
    }

    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);

    if ( !challengeTracker ) {
      ui.notifications.error(`Challenge Tracker '${challengeTrackerId}' does not exist.`);
      return;
    }

    if ( !game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notOwned", { value: challengeTrackerId }));
      return;
    }

    const executorId = game.userId;
    challengeTracker.hideHandler(executorId);
  }

  /* -------------------------------------------- */

  /**
   * Hide Challenge Tracker by title
   * @public
   * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
   **/
  static hideByTitle(challengeTrackerTitle = null) {
    if ( !challengeTrackerTitle ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "title", function: "ChallengeTracker.hideByTitle" }));
      return;
    }


    if ( !game.user.isGM || !Utils.checkAllow(game.user.role) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notAllowed", { function: "ChallengeTracker.hideByTitle" }));
      return;
    }

    if ( !game.challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerTitle }));
      return;
    }

    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle);

    if ( !challengeTracker ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerTitle }));
      return;
    }

    if ( !game.user.isGM && !Utils.checkUserId(challengeTracker.ownerId) ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notOwned", { value: challengeTrackerTitle }));
      return;
    }

    const executorId = game.userId;
    challengeTracker.hideHandler(executorId);
  }

  /* -------------------------------------------- */

  /**
   * Hide the Challenge Tracker
   * @public
   * @param {string} executorId The executor id
   */
  hideHandler(executorId) {
    this.challengeTrackerOptions.show = false;
    this.updateShowHide(executorId);
  }

  /* -------------------------------------------- */

  /**
   * Set Challenge Tracker by ID
   * @public
   * @param {string} [challengeTrackerId = null] ID of the Challenge Tracker
   * @param {Array} [challengeTrackerOptions] Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  static setById(challengeTrackerId, challengeTrackerOptions) {
    if ( !ChallengeTracker.validateOptions(challengeTrackerOptions) ) return;
    let ownerId = game.userId;

    // Set flag
    if ( game.user.isGM ) {
      for (const user of game.users.entries()) {
        const userId = user[0];
        const flagKey = Object.keys(game.users.get(userId)?.flags[MODULE.ID]).find(ct => ct.id === challengeTrackerId);
        if ( flagKey ) ownerId = userId;
      }
    }
    const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
    if ( flagData ) {
      challengeTrackerOptions = foundry.utils.mergeObject(flagData, challengeTrackerOptions);
      ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions);
    }

    // Set challenge tracker
    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);
    if ( challengeTracker ) {
      challengeTracker.challengeTrackerOptions = foundry.utils.mergeObject(
        challengeTracker.challengeTrackerOptions,
        challengeTrackerOptions
      );
      challengeTracker.render();
    }
  }

  /* -------------------------------------------- */

  /**
   * Set Challenge Tracker by title
   * @public
   * @param {string} [challengeTrackerTitle = null] Title of the Challenge Tracker
   * @param {Array} [challengeTrackerOptions] Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  static setByTitle(challengeTrackerTitle, challengeTrackerOptions) {
    if ( !ChallengeTracker.validateOptions(challengeTrackerOptions) ) return;
    const ownerId = game.userId;

    // Set flag
    const flagKey = Object.keys(game.user.flags[MODULE.ID]).find(ct => ct.title === challengeTrackerTitle);
    if ( flagKey ) {
      const flagData = ChallengeTrackerFlag.get(ownerId, flagKey);
      challengeTrackerOptions = foundry.utils.mergeObject(flagData, challengeTrackerOptions);
      ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions);
    }

    // Set challenge tracker
    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle);
    if ( challengeTracker ) {
      challengeTracker.challengeTrackerOptions = foundry.utils.mergeObject(
        challengeTracker.challengeTrackerOptions,
        challengeTrackerOptions);
      challengeTracker.render();
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete all Challenge Trackers
   * Show dialog then pass to _deleteAll()
   * @public
   **/
  static deleteAll() {

    (() => new Dialog({
      title: game.i18n.localize("challengeTracker.labels.deleteAllDialog.title"),
      content: `<p>${game.i18n.localize("challengeTracker.labels.deleteAllDialog.body")}</p>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("challengeTracker.labels.yes"),
          callback: () => { ChallengeTracker._deleteAll(); }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("challengeTracker.labels.no")
        }
      }
    }).render(true))();
  }

  /* -------------------------------------------- */

  /* Delete all Challenge Trackers */
  static _deleteAll() {
    const ownerId = game.userId;
    const challengeTrackerList = ChallengeTrackerFlag.getList(ownerId);
    for (const challengeTrackerFlag of challengeTrackerList) {
      const challengeTrackerId = challengeTrackerFlag.id;

      // Delete flag
      ChallengeTrackerFlag.unset(ownerId, challengeTrackerId);

      // Un-persist challenge tracker
      if ( game.challengeTracker ) {
        const challengeTracker = Object.values(game.challengeTracker)
          .find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);
        if ( challengeTracker ) challengeTracker.challengeTrackerOptions.persist = false;
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete Challenge Tracker by ID
   * @public
   * @param {string} [challengeTrackerId=null] ID of the Challenge Tracker
   **/
  static deleteById(challengeTrackerId = null) {
    if ( !challengeTrackerId ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTracker.deleteById" }));
      return;
    }
    let ownerId = game.userId;

    // Delete flag
    if ( game.user.isGM ) {
      for (const user of game.users.entries()) {
        const userId = user[0];
        const flagKey = Object.keys(game.users.get(userId)?.flags[MODULE.ID]).find(ct => ct.id === challengeTrackerId);
        if ( flagKey ) {
          ownerId = userId;
          break;
        }
      }
    }
    ChallengeTrackerFlag.unset(ownerId, challengeTrackerId);

    // Un-persist challenge tracker
    if ( game.challengeTracker ) {
      const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);
      if ( challengeTracker ) challengeTracker.challengeTrackerOptions.persist = false;
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete Challenge Tracker by title
   * @public
   * @param {string} [challengeTrackerTitle=null] Title of the Challenge Tracker
   **/
  static deleteByTitle(challengeTrackerTitle = null) {
    if ( !challengeTrackerTitle ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "title", function: "ChallengeTracker.deleteByTitle" }));
      return;
    }
    const ownerId = game.userId;

    // Delete flag
    const flagKey = Object.keys(game.user.flags[MODULE.ID]).find(ct => ct.title === challengeTrackerTitle);
    if ( flagKey ) {
      ChallengeTrackerFlag.unset(ownerId, flagKey);
    }

    // Un-persist challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle);
    if ( challengeTracker ) {
      challengeTracker.challengeTrackerOptions.persist = false;
    }
  }

  /* -------------------------------------------- */

  /**
   * Get Challenge Tracker by ID
   * @public
   * @param {string} [challengeTrackerId = null] ID of the Challenge Tracker
   */
  static getById(challengeTrackerId = null) {
    if ( !challengeTrackerId ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTracker.getById" }));
      return;
    }

    let ownerId = game.userId;

    // Get flag
    if ( game.user.isGM ) {
      for (const user of game.users.entries()) {
        const userId = user[0];
        const flagKey = Object.keys(game.users.get(userId)?.flags[MODULE.ID]).find(ct => ct.id === challengeTrackerId);
        if ( flagKey ) ownerId = userId;
      }
    }
    const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
    if ( flagData ) return flagData;

    // Get challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);
    if ( challengeTracker ) {
      return challengeTracker.challengeTrackerOptions;
    }
    ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Get Challenge Tracker by title
   * @public
   * @param challengeTrackerTitle
   * @param {string} [challengeTrackerId = null] Title of the Challenge Tracker
   */
  static getByTitle(challengeTrackerTitle = null) {
    if ( !challengeTrackerTitle ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "title", function: "ChallengeTracker.getByTitle" }));
      return;
    }

    const ownerId = game.userId;

    // Get flag
    const challengeTrackerId = Object.entries(game.user.flags[MODULE.ID]).find(ct => ct[1].title === challengeTrackerTitle)[0];
    if ( challengeTrackerId ) {
      const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
      if ( flagData ) return flagData;
    }

    // Update challenge tracker
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.title === challengeTrackerTitle);
    if ( challengeTracker ) {
      return challengeTracker.challengeTrackerOptions;
    }

    ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerTitle }));
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Validate Challenge Tracker options
   * @public
   * @param {Array} [challengeTrackerOptions] Challenge Tracker Options
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
   * @param {boolean} challengeTrackerOptions.scroll true = Enable, false = Disable
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   */
  static validateOptions(challengeTrackerOptions) {
    const validate = (challengeTrackerOptions, SCHEMA) =>
      Object.keys(challengeTrackerOptions)
        .filter(key => !SCHEMA.includes(key))
        .map(key => key);
    const errors = validate(challengeTrackerOptions, SCHEMA);

    if ( errors.length > 0 ) {
      for (const key of errors) {
        let fuzzyQuery = "";
        const fuzzyResult = Utils.fuzzyMatch(key, SCHEMA);
        if ( fuzzyResult ) fuzzyQuery = ` ${game.i18n.format("challengeTracker.labels.fuzzyQuery", { fuzzyResult })}`;
        ui.notifications.error(`${game.i18n.format("challengeTracker.errors.notValid", { parameter: key })}${fuzzyQuery}`);
      }
      return false;
    }
    return true;
  }
}
