Hooks.once('init', async function () {
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
    onChange: () => {
      if (game.challengeTracker) {
        ChallengeTracker.drawForEveryone(
          game.challengeTracker.totalSuccess,
          game.challengeTracker.totalFailure,
          game.challengeTracker.currentSuccess,
          game.challengeTracker.currentFailure
        )
      }
    }
  })

  game.settings.register('challenge-tracker', 'scroll', {
    name: game.i18n.localize('settings.scroll.name'),
    hint: game.i18n.localize('settings.scroll.hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => { if (game.challengeTracker) game.challengeTracker.updateScroll() }
  })
})

Hooks.once('colorSettingsInitialized', async function () {
  new window.Ardittristan.ColorSetting('challenge-tracker', 'successColor', {
    name: game.i18n.localize('settings.successColor.name'),
    hint: game.i18n.localize('settings.successColor.hint'),
    label: game.i18n.localize('settings.successColor.label'),
    scope: 'world',
    restricted: true,
    defaultColor: '#009600',
    onChange: (sett) => { 
      if (game.challengeTracker) game.challengeTracker.updateColorAndDraw(
        sett,
        game.challengeTracker.failureColor,
        game.challengeTracker.frameColor
      )
    }
  })

  new window.Ardittristan.ColorSetting('challenge-tracker', 'failureColor', {
    name: game.i18n.localize('settings.failureColor.name'),
    hint: game.i18n.localize('settings.failureColor.hint'),
    label: game.i18n.localize('settings.failureColor.label'),
    scope: 'world',
    restricted: true,
    defaultColor: '#DC0000',
    onChange: (sett) => {
      if (game.challengeTracker) game.challengeTracker.updateColorAndDraw(
        game.challengeTracker.successColor,
        sett,
        game.challengeTracker.frameColor
      )
    }
  })

  new window.Ardittristan.ColorSetting('challenge-tracker', 'frameColor', {
    name: game.i18n.localize('settings.frameColor.name'),
    hint: game.i18n.localize('settings.frameColor.hint'),
    label: game.i18n.localize('settings.frameColor.label'),
    scope: 'world',
    restricted: true,
    defaultColor: '#0F1414',
    onChange: (sett) => {
      if (game.challengeTracker) game.challengeTracker.updateColorAndDraw(game.challengeTracker.successColor, game.challengeTracker.failureColor, sett)
    }
  })
})