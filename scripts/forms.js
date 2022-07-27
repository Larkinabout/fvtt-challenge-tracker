import { ChallengeTrackerSettings, ChallengeTracker } from './main.js'
import { ChallengeTrackerFlag } from './flags.js'
import jscolor from './lib/jscolor.js'

Hooks.on('closeChallengeTrackerForm', () => {
  const buttonLocation = game.settings.get('challenge-tracker', 'buttonLocation')
  const controls = ui.controls
  const controlsControls = controls.controls
  const control = controlsControls.find(c => c.name === buttonLocation)
  if (!control) return
  const tool = control.tools.find(ct => ct.name === 'challenge-tracker')
  if (!tool) return
  tool.active = false
  controls.render()
})

/* Display challenge trackers in a list with options */
export class ChallengeTrackerForm extends FormApplication {
  static get defaultOptions () {
    const defaults = super.defaultOptions

    const overrides = {
      height: 'auto',
      width: 'auto',
      id: 'challenge-tracker-form',
      template: ChallengeTrackerSettings.templates.challengeTrackerForm,
      title: game.i18n.localize('challengeTracker.labels.challengeTrackerFormTitle'),
      userId: game.userId,
      closeOnSubmit: false,
      submitOnChange: true
    }

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides)

    return mergedOptions
  }

  getData (options) {
    return {
      ownerId: options.userId,
      challengeTrackerList: ChallengeTrackerFlag.getList(options.userId)
    }
  }

  /* Initialise the ChallengeTrackerForm */
  static init () {
    this.challengeTrackerForm = new ChallengeTrackerForm()
  }

  /**
  * Open the Challenge Tracker form by event
  * @param {object} event Event trigger
  **/
  static openByEvent (event) {
    const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId
    ChallengeTrackerForm.challengeTrackerForm.render(true, { userId })
  }

  /**
  * Open the Challenge Tracker form by user name or current user
  * @param {string} [userName=null] User name
  **/
  static open (userName = null) {
    let userId
    if (game.user.isGM && userName) {
      userId = game.users.find(u => u.name === userName).id
      if (!userId) {
        ui.notifications.info(`User '${userName}' does not exist.`)
        return
      }
    } else {
      userId = game.userId
    }
    ChallengeTrackerForm.challengeTrackerForm.render(true, { userId })
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.on('click', '[data-action]', this._handleButtonClick.bind(this))
  }

  /**
  * Handle form button events
  * @param {object} event Event trigger
  **/
  async _handleButtonClick (event) {
    const clickedElement = $(event.currentTarget)
    const action = clickedElement.data().action
    const ownerId = clickedElement.parents('[data-owner-id]')?.data()?.ownerId
    const challengeTrackerId = clickedElement.parents('li')?.data()?.challengeTrackerId

    switch (action) {
      case 'open' : {
        ChallengeTracker.open(null, null, { id: challengeTrackerId, ownerId })
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
      case 'edit': {
        await ChallengeTrackerEditForm.open(ownerId, challengeTrackerId)
        break
      }
      case 'copy': {
        await ChallengeTrackerFlag.copy(ownerId, challengeTrackerId)
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
      case 'delete': {
        await ChallengeTrackerFlag.unset(ownerId, challengeTrackerId)
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
      case 'new': {
        await ChallengeTrackerEditForm.open(ownerId)
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
    }
  }
}

/* Display challenge tracker options */
export class ChallengeTrackerEditForm extends FormApplication {
  constructor (ownerId, challengeTrackerId) {
    super()
    this.ownerId = ownerId
    this.challengeTrackerId = challengeTrackerId
    this.jscolor = jscolor
  }

  static get defaultOptions () {
    const defaults = super.defaultOptions

    const overrides = {
      height: 'auto',
      width: '300px',
      id: 'challenge-tracker-edit-form',
      template: ChallengeTrackerSettings.templates.challengeTrackerEditForm,
      title: game.i18n.localize('challengeTracker.labels.challengeTrackerEditFormTitle'),
      userId: game.userId,
      closeOnSubmit: true
    }

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides)

    return mergedOptions
  }

  getData (options) {
    if (this.challengeTrackerId) {
      return { challengeTracker: ChallengeTrackerFlag.get(this.ownerId, this.challengeTrackerId) }
    } else {
      return {
        challengeTracker: {
          frameColor: null,
          id: `${ChallengeTrackerSettings.id}-${Math.random().toString(16).slice(2)}`,
          innerBackgroundColor: null,
          innerColor: null,
          innerCurrent: 0,
          innerTotal: 3,
          outerBackgroundColor: null,
          outerColor: null,
          outerCurrent: 0,
          outerTotal: 4,
          ownerId: this.ownerId,
          persist: true,
          show: false,
          size: null,
          title: game.i18n.localize('challengeTracker.labels.challengeTrackerTitle'),
          windowed: true
        }
      }
    }
  }

  /* Initialise the ChallengeTrackerEditForm */
  static init () {
    this.challengeTrackerEditForm = new ChallengeTrackerEditForm()
  }

  /**
  * Open the Edit Challenge Tracker form
  * @param {string} ownerId User that owns the flag
  * @param {string} [challengeTrackerId=null] Unique identifier for the Challenge Tracker
  **/
  static async open (ownerId, challengeTrackerId = null) {
    ChallengeTrackerEditForm.challengeTrackerEditForm.ownerId = ownerId
    ChallengeTrackerEditForm.challengeTrackerEditForm.challengeTrackerId = challengeTrackerId
    ChallengeTrackerEditForm.challengeTrackerEditForm.render(true)
  }

  activateListeners (html) {
    super.activateListeners(html)
    this.jscolor.install()
  }

  /**
  * Merge options with flag and, if open, redraw the Challenge Tracker
  * @param {string} ownerId User that owns the flag
  * @param {string} [challengeTrackerId=null] Unique identifier for the Challenge Tracker
  **/
  async _updateObject (event, formData) {
    const ownerId = event.currentTarget.dataset.ownerId
    const challengeTrackerId = event.currentTarget.dataset.challengeTrackerId
    const flag = ChallengeTrackerFlag.get(ownerId, challengeTrackerId)
    let challengeTrackerOptions
    if (flag) {
      challengeTrackerOptions = foundry.utils.mergeObject(flag, formData)
    } else {
      const title = formData.title ?? game.i18n.localize('challengeTracker.labels.challengeTrackerTitle')
      const persist = true
      const id = challengeTrackerId
      challengeTrackerOptions = foundry.utils.mergeObject(formData, { ownerId, id, persist, title })
    }
    await ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions)
    await ChallengeTracker.draw(challengeTrackerOptions)
  }
}
