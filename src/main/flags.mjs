import { MODULE } from "./constants.mjs";

export class ChallengeTrackerFlag {
  /**
   * Get list of flags by user
   * @param {string} userId User that created the flags
   **/
  static getList(userId) {
    const challengeTrackerList = [];
    if ( !game.users.get(userId)?.flags["challenge-tracker"] ) return;
    const flagKeys = Object.keys(game.users.get(userId)?.flags["challenge-tracker"]);
    const flagsLength = flagKeys.length;
    for (const flagKey of flagKeys) {
      const flagData = game.users.get(userId)?.getFlag(MODULE.ID, flagKey);
      const moveUpDisabled = (flagData.listPosition === 1) ? "disabled" : "";
      const moveDownDisabled = (flagData.listPosition >= flagsLength) ? "disabled" : "";
      const mergedFlagData = foundry.utils.mergeObject(flagData, { moveUpDisabled, moveDownDisabled });
      challengeTrackerList.push(mergedFlagData);
    }
    challengeTrackerList.sort((a, b) => a.listPosition < b.listPosition ? 1 : -1);
    challengeTrackerList.reverse();
    return challengeTrackerList;
  }

  /* -------------------------------------------- */

  /**
   * Get flag by owner and Challenge Tracker
   * @param {string} ownerId User that owns the flag
   * @param {string} challengeTrackerId Unique identifier for the Challenge Tracker
   **/
  static get(ownerId, challengeTrackerId) {
    if ( !game.users.get(ownerId)?.flags["challenge-tracker"] ) return;
    const flagKey = Object.keys(game.users.get(ownerId)?.flags["challenge-tracker"]).find(ct => ct === challengeTrackerId);
    if ( !flagKey ) return;
    const challengeTracker = game.users.get(ownerId)?.getFlag(MODULE.ID, flagKey);
    return challengeTracker;
  }

  /* -------------------------------------------- */

  /**
   * Set flag by owner and Challenge Tracker. Used to create a challenge tracker.
   * @param {string} ownerId User that owns the flag
   * @param {Array} challengeTrackerOptions Challenge Tracker Options
   * @param {string} challengeTrackerOptions.frameColor Hex color of the frame
   * @param {string} challengeTrackerOptions.id Unique identifier of the challenge tracker
   * @param {string} challengeTrackerOptions.innerBackgroundColor Hex color of the inner circle background
   * @param {string} challengeTrackerOptions.innerColor Hex color of the inner circle
   * @param {number} challengeTrackerOptions.innerCurrent Number of filled segments of the inner circle
   * @param {number} challengeTrackerOptions.innerTotal Number of segments for the inner circle
   * @param {number} challengeTrackerOptions.listPosition Position of the challenge tracker in the Challenge Tracker list
   * @param {string} challengeTrackerOptions.outerBackgroundColor Hex color of the outer ring background
   * @param {string} challengeTrackerOptions.outerColor Hex color of the outer ring
   * @param {number} challengeTrackerOptions.outerCurrent Number of filled segments of the outer ring
   * @param {number} challengeTrackerOptions.outerTotal Number of segments for the outer ring
   * @param {boolean} challengeTrackerOptions.persist true = Persist, false = Do not persist
   * @param {boolean} challengeTrackerOptions.show true = Show, false = Hide
   * @param {number} challengeTrackerOptions.size Size of the challenge tracker in pixels
   * @param {string} challengeTrackerOptions.title Title of the challenge tracker
   * @param {boolean} challengeTrackerOptions.windowed true = Windowed, false = Windowless
   **/
  static async set(ownerId, challengeTrackerOptions) {
    await game.users.get(ownerId)?.setFlag(MODULE.ID, challengeTrackerOptions.id, challengeTrackerOptions);
    game.challengeTrackerListApp?.render(false, { width: "auto", height: "auto" });
  }

  /* -------------------------------------------- */

  /**
   * Unset flag by owner and Challenge Tracker. Used to delete a challenge tracker.
   * @param {string} ownerId User that owns the flag
   * @param {string} challengeTrackerId Unique identifier for the Challenge Tracker
   **/
  static async unset(ownerId, challengeTrackerId) {
    const flagKey = Object.keys(game.users.get(ownerId)?.flags["challenge-tracker"])
      .find(ct => ct === challengeTrackerId);
    if ( !flagKey ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
      return;
    }
    const deletedFlag = await game.users.get(ownerId)?.unsetFlag(MODULE.ID, challengeTrackerId);
    ChallengeTrackerFlag.setListPosition();
    game.challengeTrackerListApp?.render(false, { width: "auto", height: "auto" });
    ui.notifications.info(`Challenge Tracker '${challengeTrackerId}' deleted.`);
    return deletedFlag;
  }

  /* -------------------------------------------- */

  static async copy(ownerId, challengeTrackerId) {
    const flagData = ChallengeTrackerFlag.get(ownerId, challengeTrackerId);
    if ( !flagData ) return;
    const newChallengeTrackerId = `${MODULE.ID}-${Math.random().toString(16).slice(2)}`;
    const challengeTrackerTitle = flagData.title;
    const newChallengeTrackerTitle = `Copy of ${challengeTrackerTitle}`;
    const challengeTrackerOptions =
      foundry.utils.mergeObject(flagData, { id: newChallengeTrackerId, title: newChallengeTrackerTitle });
    await ChallengeTrackerFlag.set(ownerId, challengeTrackerOptions);
  }

  /* -------------------------------------------- */

  static async setOwner() {
    if ( !game.user.flags["challenge-tracker"] ) return;
    const flagKeys = Object.keys(game.user.flags["challenge-tracker"]);
    for (const flagKey of flagKeys) {
      const flag = await game.user.getFlag(MODULE.ID, flagKey);
      if ( flag.ownerId !== game.userId ) {
        const challengeTrackerOptions = foundry.utils.mergeObject(flag, { ownerId: game.userId });
        await game.user.setFlag(MODULE.ID, flagKey, challengeTrackerOptions);
      }
    }
  }

  /* -------------------------------------------- */

  static setListPosition() {
    const userId = game.userId;
    const challengeTrackerList = ChallengeTrackerFlag.getList(userId);
    if ( !challengeTrackerList ) return;
    let listPosition = 1;
    for (const challengeTracker of challengeTrackerList) {
      challengeTracker.listPosition = listPosition;
      ChallengeTrackerFlag.set(userId, { id: challengeTracker.id, listPosition });
      listPosition++;
    }
  }

  /* -------------------------------------------- */

  static setPosition(id, position) {
    const userId = game.userId;
    ChallengeTrackerFlag.set(userId, { id, position });
  }
}
