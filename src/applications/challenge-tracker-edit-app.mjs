import { MODULE, TEMPLATES } from "../main/constants.mjs";
import { ChallengeTrackerFlag } from "../main/flags.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class challengeTrackerEditApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(ownerId, challengeTrackerId) {
    super();
    this.ownerId = ownerId || game.userId;
    this.challengeTrackerId = challengeTrackerId;
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    classes: ["challenge-tracker-edit-app"],
    form: {
      handler: challengeTrackerEditApp.submit,
      closeOnSubmit: true
    },
    id: "challenge-tracker-edit-app",
    position: {
      height: 600,
      width: 400
    },
    tag: "form",
    window: {
      minimizable: true,
      resizable: true,
      title: "challengeTracker.labels.editForm.title"
    }
  };

  /* -------------------------------------------- */

  static PARTS = {
    form: {
      template: TEMPLATES.challengeTrackerEditApp
    }
  };

  /* -------------------------------------------- */

  async _prepareContext() {
    const colorPickerField = new game.colorPicker.ColorPickerField();

    if ( this.challengeTrackerId ) {
      const flags = ChallengeTrackerFlag.get(this.ownerId, this.challengeTrackerId);
      return { ...flags, colorPickerField };
    } else {
      return {
        colorPickerField,
        backgroundImage: null,
        frameColor: null,
        frameWidth: "medium",
        id: `${MODULE.ID}-${Math.random().toString(16).slice(2)}`,
        foregroundImage: null,
        innerBackgroundColor: null,
        innerColor: null,
        innerCurrent: 0,
        innerTotal: 3,
        outerBackgroundColor: null,
        outerColor: null,
        outerCurrent: 0,
        outerTotal: 4,
        ownerId: this.ownerId,
        persist: true,
        show: false,
        size: null,
        title: game.i18n.localize("challengeTracker.labels.title"),
        windowed: true
      };
    }
  }

  /* -------------------------------------------- */

  /* Initialise the challengeTrackerEditApp */
  static init() {
    this.challengeTrackerEditApp = new challengeTrackerEditApp();
  }

  /* -------------------------------------------- */

  /**
   * Open the Edit Challenge Tracker form
   * @param {string} ownerId User that owns the flag
   * @param {string} [challengeTrackerId=null] Unique identifier for the Challenge Tracker
   **/
  static async open(ownerId, challengeTrackerId = null) {
    const editForm = challengeTrackerEditApp.challengeTrackerEditApp;
    editForm.ownerId = ownerId;
    editForm.challengeTrackerId = challengeTrackerId;
    editForm.render(true, { width: "400px", height: "auto" });
  }

  /* -------------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);
    ColorPicker.install();
  }

  /* -------------------------------------------- */

  /**
   * Merge options with flag and, if open, redraw the Challenge Tracker
   * @param {string} ownerId User that owns the flag
   * @param {string} [challengeTrackerId=null] Unique identifier for the Challenge Tracker
   * @param event
   * @param form
   * @param formData
   **/
  static async submit(event, form, formData) {
    const dataElement = event.currentTarget.querySelector("[data-challenge-tracker-id]");
    const { ownerId, challengeTrackerId } = dataElement.dataset;
    const flag = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
    let challengeTrackerOptions;
    if ( flag ) {
      challengeTrackerOptions = foundry.utils.mergeObject(flag, formData.object);
    } else {
      const title = formData.object.title ?? game.i18n.localize("challengeTracker.labels.title");
      const persist = true;
      const id = challengeTrackerId;
      const listPosition = Object.keys(game.users.get(ownerId).flags["challenge-tracker"] || {}).length + 1;
      challengeTrackerOptions = foundry.utils.mergeObject(formData, { ownerId, id, listPosition, persist, title });
    }
    await ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions);
    const challengeTracker = Object.values(game.challengeTracker)
      .find(ct => ct.challengeTrackerOptions.id === challengeTrackerId);
    if ( challengeTracker ) challengeTracker.draw(challengeTrackerOptions);
  }
}
