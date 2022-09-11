import { ChallengeTrackerSettings, ChallengeTracker } from './main.js'
import { Utils } from './utils.js'

export class Settings {
  static init () {
    game.settings.register('challenge-tracker', 'displayButton', {
      name: game.i18n.localize('challengeTracker.settings.displayButton.name'),
      hint: game.i18n.localize('challengeTracker.settings.displayButton.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        4: 'Game Master',
        3: 'Assistant GM',
        2: 'Trusted Player',
        1: 'Player'
      },
      default: ChallengeTrackerSettings.default.displayButton,
      onChange: foundry.utils.debounce(() => window.location.reload(), 100)
    })

    game.settings.register('challenge-tracker', 'buttonLocation', {
      name: game.i18n.localize('challengeTracker.settings.buttonLocation.name'),
      hint: game.i18n.localize('challengeTracker.settings.buttonLocation.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        'player-list': game.i18n.localize('challengeTracker.settings.buttonLocation.choices.playerList'),
        token: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.token'),
        measure: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.measure'),
        tiles: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.tiles'),
        drawing: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.drawing'),
        walls: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.walls'),
        lighting: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.lighting'),
        sound: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.sound'),
        notes: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.notes'),
        none: game.i18n.localize('challengeTracker.settings.buttonLocation.choices.none')
      },
      default: ChallengeTrackerSettings.default.buttonLocation,
      onChange: foundry.utils.debounce(() => window.location.reload(), 100)
    })

    game.settings.register('challenge-tracker', 'allowShow', {
      name: game.i18n.localize('challengeTracker.settings.allowShow.name'),
      hint: game.i18n.localize('challengeTracker.settings.allowShow.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        4: game.i18n.localize('challengeTracker.settings.allowShow.choices.4'),
        3: game.i18n.localize('challengeTracker.settings.allowShow.choices.3'),
        2: game.i18n.localize('challengeTracker.settings.allowShow.choices.2'),
        1: game.i18n.localize('challengeTracker.settings.allowShow.choices.1')
      },
      default: ChallengeTrackerSettings.default.allowShow,
      onChange: foundry.utils.debounce(() => window.location.reload(), 100)
    })

    game.settings.register('challenge-tracker', 'size', {
      name: game.i18n.localize('challengeTracker.settings.size.name'),
      hint: game.i18n.localize('challengeTracker.settings.size.hint'),
      scope: 'world',
      config: true,
      type: Number,
      range: {
        min: 200,
        max: 600,
        step: 50
      },
      default: ChallengeTrackerSettings.default.size,
      onChange: (size) => { ChallengeTracker.updateSize(size) }
    })

    game.settings.register('challenge-tracker', 'frameWidth', {
      name: game.i18n.localize('challengeTracker.settings.frameWidth.name'),
      hint: game.i18n.localize('challengeTracker.settings.frameWidth.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        none: game.i18n.localize('challengeTracker.settings.frameWidth.choices.none'),
        'extra-thin': game.i18n.localize('challengeTracker.settings.frameWidth.choices.extraThin'),
        thin: game.i18n.localize('challengeTracker.settings.frameWidth.choices.thin'),
        medium: game.i18n.localize('challengeTracker.settings.frameWidth.choices.medium'),
        thick: game.i18n.localize('challengeTracker.settings.frameWidth.choices.thick')
      },
      default: ChallengeTrackerSettings.default.frameWidth,
      onChange: (frameWidth) => { ChallengeTracker.updateFrameWidth(frameWidth) }
    })

    game.settings.register('challenge-tracker', 'scroll', {
      name: game.i18n.localize('challengeTracker.settings.scroll.name'),
      hint: game.i18n.localize('challengeTracker.settings.scroll.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: ChallengeTrackerSettings.default.scroll,
      onChange: (scroll) => { ChallengeTracker.updateScroll(scroll) }
    })

    game.settings.register('challenge-tracker', 'windowed', {
      name: game.i18n.localize('challengeTracker.settings.windowed.name'),
      hint: game.i18n.localize('challengeTracker.settings.windowed.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: ChallengeTrackerSettings.default.windowed,
      onChange: (windowed) => { ChallengeTracker.updateWindowed(windowed) }
    })
  }

  static initColorSettings () {
    ColorPicker.register(
      'challenge-tracker',
      'innerBackgroundColor',
      {
        name: game.i18n.localize('challengeTracker.settings.innerBackgroundColor.name'),
        hint: game.i18n.localize('challengeTracker.settings.innerBackgroundColor.hint'),
        scope: 'world',
        restricted: true,
        default: ChallengeTrackerSettings.default.innerBackgroundColor,
        onChange: (innerBackgroundColor) => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting('challenge-tracker', 'outerBackgroundColor', ChallengeTrackerSettings.default.outerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'outerColor', ChallengeTrackerSettings.default.outerColor),
            innerBackgroundColor,
            Utils.getSetting('challenge-tracker', 'innerColor', ChallengeTrackerSettings.default.innerColor),
            Utils.getSetting('challenge-tracker', 'frameColor', ChallengeTrackerSettings.default.frameColor)
          )
        }
      },
      {
        format: 'hexa',
        alphaChannel: true
      }
    )

    ColorPicker.register(
      'challenge-tracker',
      'innerColor',
      {
        name: game.i18n.localize('challengeTracker.settings.innerColor.name'),
        hint: game.i18n.localize('challengeTracker.settings.innerColor.hint'),
        scope: 'world',
        restricted: true,
        default: ChallengeTrackerSettings.default.innerColor,
        onChange: (innerColor) => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting('challenge-tracker', 'outerBackgroundColor', ChallengeTrackerSettings.default.outerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'outerColor', ChallengeTrackerSettings.default.outerColor),
            Utils.getSetting('challenge-tracker', 'innerBackgroundColor', ChallengeTrackerSettings.default.innerBackgroundColor),
            innerColor,
            Utils.getSetting('challenge-tracker', 'frameColor', ChallengeTrackerSettings.default.frameColor)
          )
        }
      },
      {
        format: 'hexa',
        alphaChannel: true
      }
    )

    ColorPicker.register(
      'challenge-tracker',
      'outerBackgroundColor',
      {
        name: game.i18n.localize('challengeTracker.settings.outerBackgroundColor.name'),
        hint: game.i18n.localize('challengeTracker.settings.outerBackgroundColor.hint'),
        scope: 'world',
        restricted: true,
        default: ChallengeTrackerSettings.default.outerBackgroundColor,
        onChange: (outerBackgroundColor) => {
          ChallengeTracker.updateColorAndDraw(
            outerBackgroundColor,
            Utils.getSetting('challenge-tracker', 'outerColor', ChallengeTrackerSettings.default.outerColor),
            Utils.getSetting('challenge-tracker', 'innerBackgroundColor', ChallengeTrackerSettings.default.innerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'innerColor', ChallengeTrackerSettings.default.innerColor),
            Utils.getSetting('challenge-tracker', 'frameColor', ChallengeTrackerSettings.default.frameColor)
          )
        }
      },
      {
        format: 'hexa',
        alphaChannel: true
      }
    )

    ColorPicker.register(
      'challenge-tracker',
      'outerColor',
      {
        name: game.i18n.localize('challengeTracker.settings.outerColor.name'),
        hint: game.i18n.localize('challengeTracker.settings.outerColor.hint'),
        scope: 'world',
        restricted: true,
        default: ChallengeTrackerSettings.default.outerColor,
        onChange: (outerColor) => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting('challenge-tracker', 'outerBackgroundColor', ChallengeTrackerSettings.default.outerBackgroundColor),
            outerColor,
            Utils.getSetting('challenge-tracker', 'innerBackgroundColor', ChallengeTrackerSettings.default.innerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'innerColor', ChallengeTrackerSettings.default.innerColor),
            Utils.getSetting('challenge-tracker', 'frameColor', ChallengeTrackerSettings.default.frameColor)
          )
        }
      },
      {
        format: 'hexa',
        alphaChannel: true
      }
    )

    ColorPicker.register(
      'challenge-tracker',
      'frameColor',
      {
        name: game.i18n.localize('challengeTracker.settings.frameColor.name'),
        hint: game.i18n.localize('challengeTracker.settings.frameColor.hint'),
        scope: 'world',
        restricted: true,
        default: ChallengeTrackerSettings.default.frameColor,
        onChange: (frameColor) => {
          ChallengeTracker.updateColorAndDraw(
            Utils.getSetting('challenge-tracker', 'outerBackgroundColor', ChallengeTrackerSettings.default.outerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'outerColor', ChallengeTrackerSettings.default.outerColor),
            Utils.getSetting('challenge-tracker', 'innerBackgroundColor', ChallengeTrackerSettings.default.innerBackgroundColor),
            Utils.getSetting('challenge-tracker', 'innerColor', ChallengeTrackerSettings.default.innerColor),
            frameColor
          )
        }
      },
      {
        format: 'hex',
        alphaChannel: true
      }
    )
  }
}
