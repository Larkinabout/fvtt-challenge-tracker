import { ChallengeTracker } from "./challenge-tracker.mjs";
import { MODULE, TEMPLATES } from "../main/constants.mjs";
import { challengeTrackerEditApp } from "./challenge-tracker-edit-app.mjs";
import { ChallengeTrackerFlag } from "../main/flags.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class challengeTrackerListApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options={}) {
    super(options);
    this.userId = options.userId || game.userId;
    this.scrollTop = 0;
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    actions: {
      copy: challengeTrackerListApp.copyTracker,
      create: challengeTrackerListApp.createTracker,
      delete: challengeTrackerListApp.deleteTracker,
      edit: challengeTrackerListApp.editTracker,
      open: challengeTrackerListApp.openTracker,
      "move-up": challengeTrackerListApp.moveUp,
      "move-down": challengeTrackerListApp.moveDown
    },
    classes: ["challenge-tracker-list-app"],
    form: {
      closeOnSubmit: false,
      submitOnChange: true
    },
    id: "challenge-tracker-list-app",
    position: {
      height: "auto",
      width: "360"
    },
    tag: "aside",
    window: {
      resizable: true,
      title: "challengeTracker.labels.form.title"
    }
  };

  /* -------------------------------------------- */

  static PARTS = {
    form: {
      template: TEMPLATES.challengeTrackerListApp
    }
  };

  /* -------------------------------------------- */

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if ( options.isFirstRender && ui.nav ) {
      const {right, top} = ui.nav.element.getBoundingClientRect();
      const uiScale = game.settings.get("core", "uiConfig").uiScale;
      options.position.left ??= right + (16 * uiScale);
      options.position.top ??= top;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _canRender(options) {
    // Const rc = options.renderContext;
    // if ( rc && !["createregions", "updateregions", "deleteregions"].includes(rc) ) return false;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    this.window.close.remove(); // Prevent closing
    return frame;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async close(options={}) {
    if ( !options.closeKey ) return super.close(options);
    return this;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    canvas.scene.apps[this.id] = this;
  }

  /* -------------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);
    this._activateListeners();
  }

  /* -------------------------------------------- */

  async _prepareContext() {
    return {
      ownerId: this.userId,
      challengeTrackerList: ChallengeTrackerFlag.getList(this.userId)
    };
  }

  /* -------------------------------------------- */

  _activateListeners(html) {
    html = this.element;
  }

  /* -------------------------------------------- */

  /* Initialise the challengeTrackerListApp */
  static init() {
    game.challengeTrackerListApp = new challengeTrackerListApp();
    game.challengeTrackerListApp._init();
  }

  _init() {
    Hooks.on("renderchallengeTrackerListApp", async () => {
      const ul = $("ul.challenge-tracker-list-app")[0];
      if ( !ul ) return;
      ul.scrollTop = this.scrollTop;
    });
  }

  /* -------------------------------------------- */

  /**
   * Open the Challenge Tracker form by event
   * @param {object} event Event trigger
   **/
  static openByEvent(event) {
    const userId = $(event.currentTarget).parents("[data-user-id]")?.data()?.userId;
    game.challengeTrackerListApp.render(true, { userId });
  }

  /* -------------------------------------------- */

  /**
   * Open the Challenge Tracker form by user name or current user
   * @param {string} [userName=null] User name
   **/
  static open(userName = null) {
    let userId;
    if ( game.user.isGM && userName ) {
      userId = game.users.find(u => u.name === userName).id;
      if ( !userId ) {
        ui.notifications.info(`User '${userName}' does not exist.`);
        return;
      }
    } else {
      userId = game.userId;
    }
    game.challengeTrackerListApp.render(true, { userId });
  }

  getEventData(event) {
    const listElement = event.target.closest("li");
    const ownerId = listElement.dataset?.ownerId;
    const challengeTrackerId = listElement.dataset?.challengeTrackerId;

    return {
      ownerId,
      challengeTrackerId
    };
  }

  /* -------------------------------------------- *
   * ACTIONS
   * -------------------------------------------- */

  static async copyTracker(event) {
    const { ownerId, challengeTrackerId } = this.getEventData(event);
    await ChallengeTrackerFlag.copy(ownerId, challengeTrackerId);
  }

  /* -------------------------------------------- */

  static createTracker(_event) {
    challengeTrackerEditApp.open(this.userId);
  }

  /* -------------------------------------------- */

  static async deleteTracker(event) {
    const { ownerId, challengeTrackerId } = this.getEventData(event);
    await ChallengeTrackerFlag.unset(ownerId, challengeTrackerId);
  }

  /* -------------------------------------------- */

  static editTracker(event) {
    const { ownerId, challengeTrackerId } = this.getEventData(event);
    challengeTrackerEditApp.open(ownerId, challengeTrackerId);
  }

  /* -------------------------------------------- */

  static openTracker(event) {
    const { ownerId, challengeTrackerId } = this.getEventData(event);
    ChallengeTracker.open({ id: challengeTrackerId, ownerId });
  }

  /* -------------------------------------------- */

  static moveUp(event) {
    this.move(event, "up");
  }

  /* -------------------------------------------- */

  static moveDown(event) {
    this.move(event, "down");
  }

  /* -------------------------------------------- */

  async move(event, direction) {
    const { ownerId, challengeTrackerId } = this.getEventData(event);
    const ul = this.element.querySelector("ul.challenge-tracker-list-app");
    this.scrollTop = ul.scrollTop;

    const flagLength = Object.keys(game.users.get(ownerId).flags["challenge-tracker"]).length;
    const challengeTracker1 = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
    if ( !challengeTracker1 ) return;
    const originalPosition = challengeTracker1.listPosition;
    if ( (direction === "up" && originalPosition === 1)
      || (direction === "down" && originalPosition >= flagLength) ) return;
    let newPosition = null;
    switch (direction) {
      case "up":
        newPosition = originalPosition - 1;
        break;
      case "down":
        newPosition = originalPosition + 1;
        break;
    }
    const challengeTracker2 = Object.values(game.users.get(ownerId).flags["challenge-tracker"]).find(ct => ct.listPosition === newPosition);
    await ChallengeTrackerFlag.set(ownerId, { id: challengeTrackerId, listPosition: newPosition });
    if ( challengeTracker2 ) {
      await ChallengeTrackerFlag.set(ownerId, { id: challengeTracker2.id, listPosition: originalPosition });
    }
    this.render(false, { width: "auto", height: "auto" });

  }
}
