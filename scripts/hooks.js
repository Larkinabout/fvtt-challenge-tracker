Hooks.once('ready', async function () {
  if (game.user.isGM) {
    try { window.Ardittristan.ColorSetting.tester } catch {
      ui.notifications.notify("Challenge Tracker: To use the color pickers, enable the 'lib - colorsettings' module.")
    }
  }
})

Hooks.on('renderChallengeTracker', async function () {
  if (!game.challengeTracker) return
  for (const element of game.challengeTracker) {
    if (element._state === 1) {
      element.draw()
      element.activateListenersPostDraw()
    }
  }
})

Hooks.on('closeChallengeTracker', async function () {
  if (!game.user.isGM) return
  if (!game.challengeTracker) return
  for (const element of game.challengeTracker) {
    if (element._state === -2) {
      element.close_()
    }
  }
})

let ChallengeTrackerSocket

Hooks.once('socketlib.ready', () => {
  ChallengeTrackerSocket = socketlib.registerModule('challenge-tracker')
  ChallengeTrackerSocket.register('openHandler', ChallengeTracker.openHandler)
  ChallengeTrackerSocket.register('drawHandler', ChallengeTracker.drawHandler)
  ChallengeTrackerSocket.register('closeHandler', ChallengeTracker.closeHandler)
})
