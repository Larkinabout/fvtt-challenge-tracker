import { ChallengeTracker } from './main.js'
import { Utils } from './utils.js'
import { Settings } from './settings.js'

Hooks.once('init', () => {
  Settings.init()
})

Hooks.once('colorSettingsInitialized', async () => {
  Settings.initColorSettings()
})

Hooks.once('socketlib.ready', () => {
  window.ChallengeTrackerSocket = socketlib.registerModule('challenge-tracker')
  ChallengeTrackerSocket.register('openHandler', ChallengeTracker.openHandler)
  ChallengeTrackerSocket.register('drawHandler', ChallengeTracker.drawHandler)
  ChallengeTrackerSocket.register('closeHandler', ChallengeTracker.closeHandler)
})

Hooks.once('ready', async () => {
  if (game.user.isGM) {
    try { window.Ardittristan.ColorSetting.tester } catch {
      ui.notifications.notify("Challenge Tracker: To use the color pickers, enable the 'lib - colorsettings' module.")
    }
  }

  // Initialize Challenge Tracker
  window.ChallengeTracker = {
    open: ChallengeTracker.open,
    openHandler: ChallengeTracker.openHandler,
    drawHandler: ChallengeTracker.drawHandler,
    closeHandler: ChallengeTracker.drawHandler,
    show: ChallengeTracker.show,
    hide: ChallengeTracker.hide,
    updateSize: ChallengeTracker.updateSize,
    updateScroll: ChallengeTracker.updateScroll
  }
})

Hooks.on('renderChallengeTracker', async () => {
  if (!game.challengeTracker) return
  for (const element of game.challengeTracker) {
    if (element._state === 1) {
      element.draw()
      element.activateListenersPostDraw()
    }
  }
})
/*
Hooks.on('closeChallengeTracker', async () => {
  if (!game.user.isGM && !Utils.checkPermission) return
  if (!game.challengeTracker) return
  for (const element of game.challengeTracker) {
    if (game.user.isGM || Utils.checkUserId(element.ownerId)) {
      if (element._state === -2) {
        element._close()
      }
    }
  }
})
*/
