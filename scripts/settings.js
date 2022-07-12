import { ChallengeTracker } from './main.js'

export class Settings {
  static init () {
    game.settings.register('challenge-tracker', 'allowShow', {
      name: game.i18n.localize('settings.allowShow.name'),
      hint: game.i18n.localize('settings.allowShow.hint'),
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
      name: game.i18n.localize('settings.size.name'),
      hint: game.i18n.localize('settings.size.hint'),
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

    game.settings.register('challenge-tracker', 'windowed', {
      name: game.i18n.localize('settings.windowed.name'),
      hint: game.i18n.localize('settings.windowed.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      onChange: (windowed) => { ChallengeTracker.updateWindowed(windowed) }
    })

    game.settings.register('challenge-tracker', 'scroll', {
      name: game.i18n.localize('settings.scroll.name'),
      hint: game.i18n.localize('settings.scroll.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      onChange: (scroll) => { ChallengeTracker.updateScroll(scroll) }
    })
  }

  static initColorSettings () {
    new window.Ardittristan.ColorSetting('challenge-tracker', 'outerColor', {
      name: game.i18n.localize('settings.outerColor.name'),
      hint: game.i18n.localize('settings.outerColor.hint'),
      label: game.i18n.localize('settings.outerColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#009600',
      onChange: (outerColor) => { 
        ChallengeTracker.updateColorAndDraw(
          outerColor,
          game.settings.get('challenge-tracker', 'innerColor'),
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: "challenge-tracker.allowShow"
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'innerColor', {
      name: game.i18n.localize('settings.innerColor.name'),
      hint: game.i18n.localize('settings.innerColor.hint'),
      label: game.i18n.localize('settings.innerColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#DC0000',
      onChange: (innerColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerColor'),
          innerColor,
          game.settings.get('challenge-tracker', 'frameColor')
        )
      },
      insertAfter: "challenge-tracker.allowShow"
    })

    new window.Ardittristan.ColorSetting('challenge-tracker', 'frameColor', {
      name: game.i18n.localize('settings.frameColor.name'),
      hint: game.i18n.localize('settings.frameColor.hint'),
      label: game.i18n.localize('settings.frameColor.label'),
      scope: 'world',
      restricted: true,
      defaultColor: '#0F1414',
      onChange: (frameColor) => {
        ChallengeTracker.updateColorAndDraw(
          game.settings.get('challenge-tracker', 'outerColor'),
          game.settings.get('challenge-tracker', 'innerColor'),
          frameColor
        )
      },
      insertAfter: "challenge-tracker.allowShow"
    })
  }
}
