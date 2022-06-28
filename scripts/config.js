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
    onChange: (size) => { ChallengeTracker.updateSize(size) }
  })

  game.settings.register('challenge-tracker', 'scroll', {
    name: game.i18n.localize('settings.scroll.name'),
    hint: game.i18n.localize('settings.scroll.hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: (scroll) => { ChallengeTracker.updateScroll(scroll) }
  })
})

Hooks.once('colorSettingsInitialized', async function () {
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
    }
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
    }
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
    }
  })
})
