import { ChallengeTracker } from './main.js'

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
      default: 1,
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
      default: 'player-list',
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
      default: 4,
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
      default: 400,
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
      default: 'medium',
      onChange: (frameWidth) => { ChallengeTracker.updateFrameWidth(frameWidth) }
    })

    game.settings.register('challenge-tracker', 'scroll', {
      name: game.i18n.localize('challengeTracker.settings.scroll.name'),
      hint: game.i18n.localize('challengeTracker.settings.scroll.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      onChange: (scroll) => { ChallengeTracker.updateScroll(scroll) }
    })

    game.settings.register('challenge-tracker', 'windowed', {
      name: game.i18n.localize('challengeTracker.settings.windowed.name'),
      hint: game.i18n.localize('challengeTracker.settings.windowed.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      onChange: (windowed) => { ChallengeTracker.updateWindowed(windowed) }
    })

    game.settings.register('challenge-tracker', 'scroll', {
      name: game.i18n.localize('challengeTracker.settings.scroll.name'),
      hint: game.i18n.localize('challengeTracker.settings.scroll.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      onChange: (scroll) => { ChallengeTracker.updateScroll(scroll) }
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
        default: '#b0000066',
        onChange: (innerBackgroundColor) => {
          ChallengeTracker.updateColorAndDraw(
            game.settings.get('challenge-tracker', 'outerBackgroundColor'),
            game.settings.get('challenge-tracker', 'outerColor'),
            innerBackgroundColor,
            game.settings.get('challenge-tracker', 'innerColor'),
            game.settings.get('challenge-tracker', 'frameColor')
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
        default: '#dc0000ff',
        onChange: (innerColor) => {
          ChallengeTracker.updateColorAndDraw(
            game.settings.get('challenge-tracker', 'outerBackgroundColor'),
            game.settings.get('challenge-tracker', 'outerColor'),
            game.settings.get('challenge-tracker', 'innerBackgroundColor'),
            innerColor,
            game.settings.get('challenge-tracker', 'frameColor')
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
        default: '#1b6f1b66',
        onChange: (outerBackgroundColor) => {
          ChallengeTracker.updateColorAndDraw(
            outerBackgroundColor,
            game.settings.get('challenge-tracker', 'outerColor'),
            game.settings.get('challenge-tracker', 'innerBackgroundColor'),
            game.settings.get('challenge-tracker', 'innerColor'),
            game.settings.get('challenge-tracker', 'frameColor')
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
        default: '#228b22ff',
        onChange: (outerColor) => {
          ChallengeTracker.updateColorAndDraw(
            game.settings.get('challenge-tracker', 'outerBackgroundColor'),
            outerColor,
            game.settings.get('challenge-tracker', 'innerBackgroundColor'),
            game.settings.get('challenge-tracker', 'innerColor'),
            game.settings.get('challenge-tracker', 'frameColor')
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
        default: '#0f1414',
        onChange: (frameColor) => {
          ChallengeTracker.updateColorAndDraw(
            game.settings.get('challenge-tracker', 'outerBackgroundColor'),
            game.settings.get('challenge-tracker', 'outerColor'),
            game.settings.get('challenge-tracker', 'innerBackgroundColor'),
            game.settings.get('challenge-tracker', 'innerColor'),
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
