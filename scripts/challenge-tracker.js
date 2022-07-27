import { ChallengeTracker, ChallengeTrackerSettings } from './main.js'
import { Utils } from './utils.js'
import { Settings } from './settings.js'
import { ChallengeTrackerCompatibility } from './compatibility.js'
import { ChallengeTrackerForm, ChallengeTrackerEditForm } from './forms.js'
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

  ChallengeTrackerFlag.setOwner()

  // Initialise Challenge Tracker
  game.challengeTracker = []

  window.ChallengeTracker = {
    open: ChallengeTracker.open,
    setById: ChallengeTracker.setById,
    setByTitle: ChallengeTracker.setByTitle,
    getById: ChallengeTracker.getById,
    getByTitle: ChallengeTracker.getByTitle,
    closeAll: ChallengeTracker.closeAll,
    closeById: ChallengeTracker.closeById,
    closeByTitle: ChallengeTracker.closeByTitle,
    deleteAll: ChallengeTracker.deleteAll,
    deleteById: ChallengeTracker.deleteById,
    deleteByTitle: ChallengeTracker.deleteByTitle,
    show: ChallengeTracker.showByTitle,
    showAll: ChallengeTracker.showAll,
    showById: ChallengeTracker.showById,
    showByTitle: ChallengeTracker.showByTitle,
    hide: ChallengeTracker.hideByTitle,
    hideAll: ChallengeTracker.hideAll,
    hideById: ChallengeTracker.hideById,
    hideByTitle: ChallengeTracker.hideByTitle,
    openList: ChallengeTrackerForm.open
  }
})

/* Add buttons to the Player List */
Hooks.on('renderPlayerList', (playerList, html) => {
  const buttonLocation = game.settings.get('challenge-tracker', 'buttonLocation')
  if (buttonLocation !== 'player-list' || !Utils.checkDisplayButton(game.user.role)) return
  (async () => {
    // Sleep to let system and modules load elements onto the Player List
    await Utils.sleep(100)

    const tooltip = game.i18n.localize('challengeTracker.labels.challengeTrackerButtonTitle')
    const icon =
    `<svg width="100%" height="100%" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
      <title>${game.i18n.localize('challengeTracker.labels.challengeTrackerListTitle')}</title>
      <ellipse stroke-width="7" id="outer_circle" cx="50" cy="50" rx="50" ry="50" stroke="currentColor" fill="none" fill-opacity="0"/>
      <ellipse stroke-width="7" id="inner_circle" cx="50" cy="50" rx="30" ry="30" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_4" x1="50" x2="50" y1="0" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_5" x1="50" x2="76" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_6" x1="50" x2="24" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_8" x1="50" x2="50" y1="80" y2="100" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_9" x1="0" x2="20" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
      <line stroke-width="7" id="svg_11" x1="80" x2="100" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    </svg>`

    const listElement = html.find('li')
    for (const element of listElement) {
      const userId = $(element).data().userId
      if (game.user.isGM || userId === game.userId) {
        $(element).append(
          `<button type='button' title='${tooltip}' class='challenge-tracker-player-list-button flex0'>${icon}</button>`
        )
      } else if (game.system.id === 'swade') {
        $(element).append(
          '<span class=\'challenge-tracker-player-list-placeholder flex0\'></span>')
      }
    }

    // Add click event to button
    html.on('click', '.challenge-tracker-player-list-button', (event) => {
      ChallengeTrackerForm.openByEvent(event)
    })

    ChallengeTrackerCompatibility.minmalUiPlayerList(html)
  })()
})

Hooks.on('getSceneControlButtons', (controls) => {
  const buttonLocation = game.settings.get('challenge-tracker', 'buttonLocation')
  if (!Utils.checkDisplayButton(game.user.role)) return
  if (buttonLocation === 'player-list' || buttonLocation === 'none') return
  controls
    .find(c => c.name === buttonLocation)
    .tools.push({
      name: 'challenge-tracker',
      title: game.i18n.localize('challengeTracker.labels.challengeTrackerButtonTitle'),
      icon: 'challenge-tracker-control-button',
      onClick: (toggle) => {
        if (toggle) {
          ChallengeTrackerForm.open()
        } else {
          ChallengeTrackerForm.challengeTrackerForm.close()
        }
      },
      toggle: true
    })
})

Hooks.on('renderSceneControls', (controls, html) => {
  const controlButton = html.find('.challenge-tracker-control-button')
  const icon =
  `<svg width="100%" height="100%" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
    <title>${game.i18n.localize('challengeTracker.labels.challengeTrackerListTitle')}</title>
    <ellipse stroke-width="7" id="outer_circle" cx="50" cy="50" rx="50" ry="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <ellipse stroke-width="7" id="inner_circle" cx="50" cy="50" rx="30" ry="30" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_4" x1="50" x2="50" y1="0" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_5" x1="50" x2="76" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_6" x1="50" x2="24" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_8" x1="50" x2="50" y1="80" y2="100" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_9" x1="0" x2="20" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_11" x1="80" x2="100" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
  </svg>`
  controlButton.replaceWith(`<span id="challenge-tracker-control-button">${icon}</span>`)
})

/* Draw the challenge trackers once rendered */
Hooks.on('renderChallengeTracker', async () => {
  if (!game.challengeTracker) return
  for (const challengeTracker of Object.values(game.challengeTracker)) {
    if (challengeTracker._state === 1) {
      challengeTracker.setVariables()
      challengeTracker._draw()
      challengeTracker.activateListenersPostDraw()
    }
  }
})
