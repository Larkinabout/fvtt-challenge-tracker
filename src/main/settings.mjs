import { ChallengeTracker } from "../applications/challenge-tracker.mjs";
import { DEFAULTS, MODULE } from "./constants.mjs";
import { Utils } from "./utils.mjs";

export class Settings {
  static init() {
    game.settings.register(MODULE.ID, "displayButton", {
      name: game.i18n.localize("challengeTracker.settings.displayButton.name"),
      hint: game.i18n.localize("challengeTracker.settings.displayButton.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: {
        4: "Game Master",
        3: "Assistant GM",
        2: "Trusted Player",
        1: "Player"
      },
      default: DEFAULTS.displayButton,
      requiresReload: true
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "buttonLocation", {
      name: game.i18n.localize("challengeTracker.settings.buttonLocation.name"),
      hint: game.i18n.localize("challengeTracker.settings.buttonLocation.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: {
        "player-list": game.i18n.localize("challengeTracker.settings.buttonLocation.choices.playerList"),
        tokens: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.tokens"),
        templates: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.templates"),
        tiles: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.tiles"),
        drawings: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.drawings"),
        walls: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.walls"),
        lighting: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.lighting"),
        sounds: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.sounds"),
        regions: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.regions"),
        notes: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.notes"),
        none: game.i18n.localize("challengeTracker.settings.buttonLocation.choices.none")
      },
      default: DEFAULTS.buttonLocation,
      requiresReload: true
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "allowShow", {
      name: game.i18n.localize("challengeTracker.settings.allowShow.name"),
      hint: game.i18n.localize("challengeTracker.settings.allowShow.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: {
        4: game.i18n.localize("challengeTracker.settings.allowShow.choices.4"),
        3: game.i18n.localize("challengeTracker.settings.allowShow.choices.3"),
        2: game.i18n.localize("challengeTracker.settings.allowShow.choices.2"),
        1: game.i18n.localize("challengeTracker.settings.allowShow.choices.1")
      },
      default: DEFAULTS.allowShow,
      requiresReload: true
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "size", {
      name: game.i18n.localize("challengeTracker.settings.size.name"),
      hint: game.i18n.localize("challengeTracker.settings.size.hint"),
      scope: "world",
      config: true,
      type: Number,
      range: {
        min: 100,
        max: 500,
        step: 50
      },
      default: DEFAULTS.size,
      onChange: size => { ChallengeTracker.updateSize(size); }
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "frameWidth", {
      name: game.i18n.localize("challengeTracker.settings.frameWidth.name"),
      hint: game.i18n.localize("challengeTracker.settings.frameWidth.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: {
        none: game.i18n.localize("challengeTracker.settings.frameWidth.choices.none"),
        "extra-thin": game.i18n.localize("challengeTracker.settings.frameWidth.choices.extraThin"),
        thin: game.i18n.localize("challengeTracker.settings.frameWidth.choices.thin"),
        medium: game.i18n.localize("challengeTracker.settings.frameWidth.choices.medium"),
        thick: game.i18n.localize("challengeTracker.settings.frameWidth.choices.thick")
      },
      default: DEFAULTS.frameWidth,
      onChange: frameWidth => { ChallengeTracker.updateFrameWidth(frameWidth); }
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "scroll", {
      name: game.i18n.localize("challengeTracker.settings.scroll.name"),
      hint: game.i18n.localize("challengeTracker.settings.scroll.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: DEFAULTS.scroll,
      onChange: scroll => { ChallengeTracker.updateScroll(scroll); }
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "windowed", {
      name: game.i18n.localize("challengeTracker.settings.windowed.name"),
      hint: game.i18n.localize("challengeTracker.settings.windowed.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: DEFAULTS.windowed,
      onChange: windowed => { ChallengeTracker.updateWindowed(windowed); }
    });

    /* -------------------------------------------- */

    game.settings.register(MODULE.ID, "debug", {
      name: game.i18n.localize("challengeTracker.settings.debug.name"),
      hint: game.i18n.localize("challengeTracker.settings.debug.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: DEFAULTS.debug
    });
  }

  /* -------------------------------------------- */

  static initColorSettings() {
    ColorPicker.register(
      MODULE.ID,
      "innerBackgroundColor",
      {
        name: game.i18n.localize("challengeTracker.settings.innerBackgroundColor.name"),
        hint: game.i18n.localize("challengeTracker.settings.innerBackgroundColor.hint"),
        scope: "world",
        restricted: true,
        default: DEFAULTS.innerBackgroundColor,
        onChange: innerBackgroundColor => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting("outerBackgroundColor", DEFAULTS.outerBackgroundColor),
            Utils.getSetting("outerColor", DEFAULTS.outerColor),
            innerBackgroundColor,
            Utils.getSetting("innerColor", DEFAULTS.innerColor),
            Utils.getSetting("frameColor", DEFAULTS.frameColor)
          );
        }
      },
      {
        format: "hexa",
        alphaChannel: true
      }
    );

    /* -------------------------------------------- */

    ColorPicker.register(
      MODULE.ID,
      "innerColor",
      {
        name: game.i18n.localize("challengeTracker.settings.innerColor.name"),
        hint: game.i18n.localize("challengeTracker.settings.innerColor.hint"),
        scope: "world",
        restricted: true,
        default: DEFAULTS.innerColor,
        onChange: innerColor => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting("outerBackgroundColor", DEFAULTS.outerBackgroundColor),
            Utils.getSetting("outerColor", DEFAULTS.outerColor),
            Utils.getSetting("innerBackgroundColor", DEFAULTS.innerBackgroundColor),
            innerColor,
            Utils.getSetting("frameColor", DEFAULTS.frameColor)
          );
        }
      },
      {
        format: "hexa",
        alphaChannel: true
      }
    );

    /* -------------------------------------------- */

    ColorPicker.register(
      MODULE.ID,
      "outerBackgroundColor",
      {
        name: game.i18n.localize("challengeTracker.settings.outerBackgroundColor.name"),
        hint: game.i18n.localize("challengeTracker.settings.outerBackgroundColor.hint"),
        scope: "world",
        restricted: true,
        default: DEFAULTS.outerBackgroundColor,
        onChange: outerBackgroundColor => {
          ChallengeTracker.updateColorAndDraw(
            outerBackgroundColor,
            Utils.getSetting("outerColor", DEFAULTS.outerColor),
            Utils.getSetting("innerBackgroundColor", DEFAULTS.innerBackgroundColor),
            Utils.getSetting("innerColor", DEFAULTS.innerColor),
            Utils.getSetting("frameColor", DEFAULTS.frameColor)
          );
        }
      },
      {
        format: "hexa",
        alphaChannel: true
      }
    );

    /* -------------------------------------------- */

    ColorPicker.register(
      MODULE.ID,
      "outerColor",
      {
        name: game.i18n.localize("challengeTracker.settings.outerColor.name"),
        hint: game.i18n.localize("challengeTracker.settings.outerColor.hint"),
        scope: "world",
        restricted: true,
        default: DEFAULTS.outerColor,
        onChange: outerColor => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting("outerBackgroundColor", DEFAULTS.outerBackgroundColor),
            outerColor,
            Utils.getSetting("innerBackgroundColor", DEFAULTS.innerBackgroundColor),
            Utils.getSetting("innerColor", DEFAULTS.innerColor),
            Utils.getSetting("frameColor", DEFAULTS.frameColor)
          );
        }
      },
      {
        format: "hexa",
        alphaChannel: true
      }
    );

    /* -------------------------------------------- */

    ColorPicker.register(
      MODULE.ID,
      "frameColor",
      {
        name: game.i18n.localize("challengeTracker.settings.frameColor.name"),
        hint: game.i18n.localize("challengeTracker.settings.frameColor.hint"),
        scope: "world",
        restricted: true,
        default: DEFAULTS.frameColor,
        onChange: frameColor => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting("outerBackgroundColor", DEFAULTS.outerBackgroundColor),
            Utils.getSetting("outerColor", DEFAULTS.outerColor),
            Utils.getSetting("innerBackgroundColor", DEFAULTS.innerBackgroundColor),
            Utils.getSetting("innerColor", DEFAULTS.innerColor),
            frameColor
          );
        }
      },
      {
        format: "hex",
        alphaChannel: true
      }
    );
  }
}
