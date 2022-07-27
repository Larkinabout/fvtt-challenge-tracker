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
        'player-list': 'Player List',
        token: 'Token Controls',
        measure: 'Measurement Controls',
        tiles: 'Tile Controls',
        drawing: 'Drawing Tools',
        walls: 'Wall Controls',
        lighting: 'Lighting Controls',
        sound: 'Sound Controls',
        notes: 'Journal Notes',
        none: 'None'
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
        4: 'Game Master',
        3: 'Assistant GM',
        2: 'Trusted Player',
        1: 'Player'
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
        none: 'None',
        'extra-thin': 'Extra Thin',
        thin: 'Thin',
        medium: 'Medium',
        thick: 'Thick'
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
    new window.Ardittristan.ColorSetting('challenge-tracker', 'outerBackgroundColor', {
      name: game.i18n.localize('challengeTracker.settings.outerBackgroundColor.name'),
      hint: game.i18n.localize('challengeTracker.settings.outerBackgroundColor.hint'),
      label: game.i18n.localize('challengeTracker.settings.outerBackgroundColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#1b6f1b66',
      onChange: (outerBackgroundColor) => {
        ChallengeTracker.updateColorAndDraw(
          outerBackgroundColor,
          game.settings.get('challenge-tracker', 'outerColor'),
          game.settings.get('challenge-tracker', 'innerBackgroundColor'),
          game.settings.get('challenge-tracker', 'innerColor'),
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: 'challenge-tracker.allowShow'
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'outerColor', {
      name: game.i18n.localize('challengeTracker.settings.outerColor.name'),
      hint: game.i18n.localize('challengeTracker.settings.outerColor.hint'),
      label: game.i18n.localize('challengeTracker.settings.outerColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#228b22ff',
      onChange: (outerColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerBackgroundColor'),
          outerColor,
          game.settings.get('challenge-tracker', 'innerBackgroundColor'),
          game.settings.get('challenge-tracker', 'innerColor'),
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: 'challenge-tracker.allowShow'
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'innerBackgroundColor', {
      name: game.i18n.localize('challengeTracker.settings.innerBackgroundColor.name'),
      hint: game.i18n.localize('challengeTracker.settings.innerBackgroundColor.hint'),
      label: game.i18n.localize('challengeTracker.settings.innerBackgroundColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#b0000066',
      onChange: (innerBackgroundColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerBackgroundColor'),
          game.settings.get('challenge-tracker', 'outerColor'),
          innerBackgroundColor,
          game.settings.get('challenge-tracker', 'innerColor'),
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: 'challenge-tracker.allowShow'
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'innerColor', {
      name: game.i18n.localize('challengeTracker.settings.innerColor.name'),
      hint: game.i18n.localize('challengeTracker.settings.innerColor.hint'),
      label: game.i18n.localize('challengeTracker.settings.innerColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#DC0000ff',
      onChange: (innerColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerBackgroundColor'),
          game.settings.get('challenge-tracker', 'outerColor'),
          game.settings.get('challenge-tracker', 'innerBackgroundColor'),
          innerColor,
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: 'challenge-tracker.allowShow'
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'frameColor', {
      name: game.i18n.localize('challengeTracker.settings.frameColor.name'),
      hint: game.i18n.localize('challengeTracker.settings.frameColor.hint'),
      label: game.i18n.localize('challengeTracker.settings.frameColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#0F1414',
      onChange: (frameColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerBackgroundColor'),
          game.settings.get('challenge-tracker', 'outerColor'),
          game.settings.get('challenge-tracker', 'innerBackgroundColor'),
          game.settings.get('challenge-tracker', 'innerColor'),
          frameColor
        )
      },
      insertAfter: 'challenge-tracker.allowShow'
    })
  }
}
