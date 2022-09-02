import { ChallengeTrackerSettings, ChallengeTracker } from './main.js'
import { ChallengeTrackerFlag } from './flags.js'

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
  constructor (options) {
    super(options)
    this.scrollTop = 0
  }

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
    game.challengeTrackerForm = new ChallengeTrackerForm()
    game.challengeTrackerForm._init()
  }

  _init () {
    Hooks.on('renderChallengeTrackerForm', async () => {
      const ul = $('ul.challenge-tracker-form')[0]
      if (!ul) return
      ul.scrollTop = this.scrollTop
    })
  }

  /**
  * Open the Challenge Tracker form by event
  * @param {object} event Event trigger
  **/
  static openByEvent (event) {
    const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId
    game.challengeTrackerForm.render(true, { userId })
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
    game.challengeTrackerForm.render(true, { userId })
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
    event.preventDefault()
    const clickedElement = $(event.currentTarget)
    const action = clickedElement.data().action
    const ownerId = clickedElement.parents('[data-owner-id]')?.data()?.ownerId
    const challengeTrackerId = clickedElement.parents('li')?.data()?.challengeTrackerId
    const ul = $('ul.challenge-tracker-form')[0]
    this.scrollTop = ul.scrollTop
    switch (action) {
      case 'open' : {
        ChallengeTracker.open(null, null, { id: challengeTrackerId, ownerId })
        break
      }
      case 'edit': {
        await ChallengeTrackerEditForm.open(ownerId, challengeTrackerId)
        break
      }
      case 'copy': {
        await ChallengeTrackerFlag.copy(ownerId, challengeTrackerId)
        break
      }
      case 'delete': {
        await ChallengeTrackerFlag.unset(ownerId, challengeTrackerId)
        break
      }
      case 'move-up': {
        await this.move('up', ownerId, challengeTrackerId)
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
      case 'move-down': {
        await this.move('down', ownerId, challengeTrackerId)
        this.render(false, { width: 'auto', height: 'auto' })
        break
      }
      case 'new': {
        await ChallengeTrackerEditForm.open(ownerId)
        break
      }
    }
    this.render(false, { width: 'auto', height: 'auto' })
  }

  async move (direction, ownerId, challengeTrackerId) {
    const flagLength = Object.keys(game.users.get(ownerId).data.flags['challenge-tracker']).length
    const challengeTracker1 = ChallengeTrackerFlag.get(ownerId, challengeTrackerId)
    if (!challengeTracker1) return
    const originalPosition = challengeTracker1.listPosition
    if ((direction === 'up' && originalPosition === 1) ||
      (direction === 'down' && originalPosition >= flagLength)) return
    let newPosition = null
    switch (direction) {
      case 'up':
        newPosition = originalPosition - 1
        break
      case 'down':
        newPosition = originalPosition + 1
        break
    }
    const challengeTracker2 = Object.values(game.users.get(ownerId).data.flags['challenge-tracker']).find(ct => ct.listPosition === newPosition)
    await ChallengeTrackerFlag.set(ownerId, { id: challengeTrackerId, listPosition: newPosition })
    if (challengeTracker2) await ChallengeTrackerFlag.set(ownerId, { id: challengeTracker2.id, listPosition: originalPosition })
  }
}

/* Display challenge tracker options */
export class ChallengeTrackerEditForm extends FormApplication {
  constructor (ownerId, challengeTrackerId) {
    super()
    this.ownerId = ownerId
    this.challengeTrackerId = challengeTrackerId
  }

  static get defaultOptions () {
    const defaults = super.defaultOptions

    const overrides = {
      height: 'auto',
      width: '400px',
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
          backgroundImage: null,
          frameColor: null,
          frameWidth: 'medium',
          id: `${ChallengeTrackerSettings.id}-${Math.random().toString(16).slice(2)}`,
          foregroundImage: null,
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
    ChallengeTrackerEditForm.challengeTrackerEditForm.render(true, { width: '400px', height: 'auto' })
  }

  activateListeners (html) {
    super.activateListeners(html)
    ColorPicker.install()
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
      const listPosition = Object.keys(game.users.get(ownerId).data.flags['challenge-tracker'] || {}).length + 1
      challengeTrackerOptions = foundry.utils.mergeObject(formData, { ownerId, id, listPosition, persist, title })
    }
    await ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions)
    const challengeTracker = Object.values(game.challengeTracker).find(ct => ct.challengeTrackerOptions.id === challengeTrackerId)
    if (challengeTracker) challengeTracker.draw(challengeTrackerOptions)
  }
}
