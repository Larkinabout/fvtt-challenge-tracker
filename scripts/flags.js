import { ChallengeTrackerSettings, ChallengeTracker } from './main.js'
import { ChallengeTrackerForm } from './form.js'

export class ChallengeTrackerFlag {
  /**
  * Get list of flags by user
  * @param {string} userId User that created the flags
  **/
  static getList (userId) {
    const challengeTrackerList = []
    if (!game.users.get(userId)?.data.flags['challenge-tracker']) return
    const flagKeys = Object.keys(game.users.get(userId)?.data.flags['challenge-tracker'])
    for (const flagKey of flagKeys) {
      challengeTrackerList.push(game.users.get(userId)?.getFlag(ChallengeTrackerSettings.id, flagKey))
    }
    return challengeTrackerList
  }

  /**
  * Get flag by owner and Challenge Tracker
  * @param {string} ownerId User that owns the flag
  * @param {string} challengeTrackerId Unique identifier for the Challenge Tracker
  **/
  static get (ownerId, challengeTrackerId) {
    if (!game.users.get(ownerId)?.data.flags['challenge-tracker']) return
    const flagKey = Object.keys(game.users.get(ownerId)?.data.flags['challenge-tracker']).find(ct => ct === challengeTrackerId)
    if (!flagKey) return
    const challengeTracker = game.users.get(ownerId)?.getFlag(ChallengeTrackerSettings.id, flagKey)
    return challengeTracker
  }

  /**
  * Set flag by owner and Challenge Tracker. Used to create a challenge tracker.
  * @param {string} ownerId User that owns the flag
  * @param {array} challengeTrackerOptions Challenge Tracker Options
  * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
  * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
  * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
  * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
  * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
  * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
  * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
  * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
  * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
  * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
  * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
  * @param {string} challengeTrackerOptions.title Title of the challenge tracker
  * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
  **/
  static async set (ownerId, challengeTrackerOptions) {
    await game.users.get(ownerId)?.setFlag(ChallengeTrackerSettings.id, challengeTrackerOptions.id, challengeTrackerOptions)
    ChallengeTrackerForm.challengeTrackerForm?.render(false, { width: 'auto', height: 'auto' })
  }

  /**
  * Unset flag by owner and Challenge Tracker. Used to delete a challenge tracker.
  * @param {string} ownerId User that owns the flag
  * @param {string} challengeTrackerId Unique identifier for the Challenge Tracker
  **/
  static async unset (ownerId, challengeTrackerId) {
    const flagKey = Object.keys(game.users.get(ownerId)?.data.flags['challenge-tracker']).find(ct => ct === challengeTrackerId)
    if (!flagKey) {
      ui.notifications.error(`Challenge Tracker '${challengeTrackerId}' does not exist.`)
      return
    }
    const deletedFlag = game.users.get(ownerId)?.unsetFlag(ChallengeTrackerSettings.id, challengeTrackerId)
    ui.notifications.info(`Challenge Tracker '${challengeTrackerId}' deleted.`)
    return deletedFlag
  }
}
