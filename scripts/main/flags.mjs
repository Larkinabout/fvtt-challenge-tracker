import { MODULE } from "./constants.mjs";

export class ChallengeTrackerFlag {
  /**
   * Get list of flags by user
   * @param {string} userId User that created the flags
   **/
  static getList(userId) {
    const challengeTrackerList = [];
    const user = game.users.get(userId);
    const userFlags = user?.flags?.["challenge-tracker"];
    if ( !userFlags ) return [];

    const flagKeys = Object.keys(userFlags);
    const flagsLength = flagKeys.length;
    for (const flagKey of flagKeys) {
      const flagData = user?.getFlag(MODULE.ID, flagKey);
      if ( !flagData || !flagData.id ) continue;

      const listPosition = Number.isFinite(flagData.listPosition)
        ? Number(flagData.listPosition)
        : Number.MAX_SAFE_INTEGER;
      const moveUpDisabled = (listPosition === 1) ? "disabled" : "";
      const moveDownDisabled = (listPosition >= flagsLength) ? "disabled" : "";
      const mergedFlagData = foundry.utils.mergeObject(flagData, {
        ownerId: user.id,
        moveUpDisabled,
        moveDownDisabled,
        listPosition
      });
      challengeTrackerList.push(mergedFlagData);
    }

    challengeTrackerList.sort((a, b) => (Number(a.listPosition ?? Number.MAX_SAFE_INTEGER)) - (Number(b.listPosition ?? Number.MAX_SAFE_INTEGER)));
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
    if ( !challengeTrackerOptions ) return;

    const normalizedOwnerId = ownerId ?? game.userId;
    const normalizedId = challengeTrackerOptions.id ?? `${MODULE.ID}-${Math.random().toString(16).slice(2)}`;
    const normalizedOptions = foundry.utils.mergeObject(challengeTrackerOptions, {
      id: normalizedId,
      ownerId: normalizedOwnerId
    });

    await game.users.get(normalizedOwnerId)?.setFlag(MODULE.ID, normalizedId, normalizedOptions);
    game.challengeTrackerListApp?.render(false, { width: "auto", height: "auto" });
    return normalizedOptions;
  }

  /* -------------------------------------------- */

  /**
   * Unset flag by owner and Challenge Tracker. Used to delete a challenge tracker.
   * @param {string} ownerId User that owns the flag
   * @param {string} challengeTrackerId Unique identifier for the Challenge Tracker
   **/
  static async unset(ownerId, challengeTrackerId) {
    if ( !challengeTrackerId ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.notSupplied", { parameter: "id", function: "ChallengeTrackerFlag.unset" }));
      return;
    }

    const user = game.users.get(ownerId);
    const flagSet = user?.flags?.["challenge-tracker"];
    if ( !flagSet ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
      return;
    }

    const flagKey = Object.keys(flagSet).find(ct => ct === challengeTrackerId);
    if ( !flagKey ) {
      ui.notifications.error(game.i18n.format("challengeTracker.errors.doesNotExist", { value: challengeTrackerId }));
      return;
    }

    const deletedFlag = await user?.unsetFlag(MODULE.ID, challengeTrackerId);
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
