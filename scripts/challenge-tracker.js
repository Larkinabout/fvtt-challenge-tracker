import { ChallengeTracker } from './main.js'
import { Utils } from './utils.js'
import { Settings } from './settings.js'
import { ChallengeTrackerForm, ChallengeTrackerEditForm } from './form.js'
import { ChallengeTrackerFlag } from './flags.js'

Hooks.once('init', () => {
  Settings.init()
  ChallengeTrackerForm.init()
  ChallengeTrackerEditForm.init()
  Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this)
  })
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
    updateWindowed: ChallengeTracker.updateWindowed,
    updateScroll: ChallengeTracker.updateScroll
  }
})

/* Add buttons to the Player List */
Hooks.on('renderPlayerList', (playerList, html) => {
  const tooltip = game.i18n.localize('challengeTracker.labels.challengeTrackerButtonTitle')
  const svg = `<svg width="100" height="100" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
    <title>challenge-tracker-button-icon</title>
    <ellipse stroke-width="7" id="outer_circle" cx="50" cy="50" rx="50" ry="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <ellipse stroke-width="7" id="inner_circle" cx="50" cy="50" rx="30" ry="30" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_4" x1="50" x2="50" y1="0" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_5" x1="50" x2="76" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_6" x1="50" x2="24" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_8" x1="50" x2="50" y1="80" y2="100" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_9" x1="0" x2="20" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_11" x1="80" x2="100" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
  </svg>`
  if (game.user.isGM) {
    const listElement = html.find('li')
    for (const element of listElement) {
      $(element).append(
        `<button type='button' title='${tooltip}' class='challenge-tracker-player-list-button flex0'>${svg}</button>`
      )
    }
  } else {
    const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`)
    loggedInUserListItem.append(
        `<button type='button' title='${tooltip}' class='challenge-tracker-player-list-button flex0'>${svg}</button>`
    )
  }

  // Add click event to button
  html.on('click', '.challenge-tracker-player-list-button', (event) => {
    ChallengeTrackerForm.open(event)
  })
})

/* Draw the challenge trackers once rendered */
Hooks.on('renderChallengeTracker', async () => {
  if (!game.challengeTracker) return
  for (const challengeTracker of game.challengeTracker) {
    if (challengeTracker._state === 1) {
      challengeTracker._draw()
      challengeTracker.activateListenersPostDraw()
    }
  }
})
