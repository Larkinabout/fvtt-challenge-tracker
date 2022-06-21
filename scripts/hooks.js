Hooks.once('ready', async function () {
  if (game.user.isGM) {
    try { window.Ardittristan.ColorSetting.tester } catch {
      ui.notifications.notify("Challenge Tracker: To use the color pickers, enable the 'lib - colorsettings' module.")
    }
  }
})

Hooks.on('renderChallengeTracker', async function () {
  game.challengeTracker.draw(
    game.challengeTracker.totalSuccess,
    game.challengeTracker.totalFailure,
    game.challengeTracker.currentSuccess,
    game.challengeTracker.currentFailure
  )
  game.challengeTracker.activateListenersPostDraw()
})

Hooks.on('closeChallengeTracker', async function () {
  if (game.user.isGM) ChallengeTrackerSocket.executeForEveryone('closeHandler')
})

let ChallengeTrackerSocket

Hooks.once('socketlib.ready', () => {
  ChallengeTrackerSocket = socketlib.registerModule('challenge-tracker')
  ChallengeTrackerSocket.register('openHandler', ChallengeTracker.openHandler)
  ChallengeTrackerSocket.register('drawHandler', ChallengeTracker.drawHandler)
  ChallengeTrackerSocket.register('closeHandler', ChallengeTracker.closeHandler)
})
