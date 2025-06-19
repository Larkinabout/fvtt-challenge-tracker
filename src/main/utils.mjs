import { DEFAULTS, MODULE } from "./constants.mjs";

/**
 * Console logger
 */
export class Logger {
  static info(message, notify = false) {
    if ( notify ) ui.notifications.info(`Challenge Tracker | ${message}`);
    else console.log(`Challenge Tracker Info | ${message}`);
  }

  /* -------------------------------------------- */

  static error(message, notify = false) {
    if ( notify ) ui.notifications.error(`Challenge Tracker | ${message}`);
    else console.error(`Challenge Tracker Error | ${message}`);
  }

  /* -------------------------------------------- */

  static debug(message, data) {
    const isDebug = Utils.getSetting("debug");
    if ( isDebug ) {
      if ( !data ) {
        console.log(`Challenge Tracker Debug | ${message}`);
        return;
      }
      const dataClone = Utils.deepClone(data);
      console.log(`Challenge Tracker Debug | ${message}`, dataClone);
    }
  }
}

/* -------------------------------------------- */

export class Utils {
  /**
   * Whether the user is allowed to use challenge trackers
   * @public
   * @param {number} userRole The user role
   * @returns {boolean}
   */
  static checkAllow(userRole) {
    const allowShow = this.getSetting("allowShow");
    if ( userRole >= allowShow ) return true;
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Whether to display the challenge tracker list button
   * @public
   * @param {number} userRole The user role
   * @returns {boolean}
   */
  static checkDisplayButton(userRole) {
    const displayButton = this.getSetting("displayButton", DEFAULTS.displayButton);
    if ( userRole >= displayButton ) return true;
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Whether the current user id matches the passed user id
   * @public
   * @param {string} userId The user id
   * @returns {boolean}
   */
  static checkUserId(userId) {
    if ( game.userId === userId ) return true;
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Get setting value
   * @public
   * @param {string} key               The setting key
   * @param {string=null} defaultValue The setting default value
   * @returns {*}                      The setting value
   */
  static getSetting(key, defaultValue = null) {
    let value = defaultValue ?? null;
    try {
      value = game.settings.get(MODULE.ID, key);
    } catch {
      Logger.debug(`Setting '${key}' not found`);
    }
    return value;
  }

  /* -------------------------------------------- */

  /**
   * Set setting value
   * @public
   * @param {string} key   The setting key
   * @param {string} value The setting value
   */
  static async setSetting(key, value) {
    if ( game.settings.settings.get(`${MODULE.ID}.${key}`) ) {
      await game.settings.set(MODULE.ID, key, value);
      Logger.debug(`Setting '${key}' set to '${value}'`);
    } else {
      Logger.debug(`Setting '${key}' not found`);
    }
  }

  /* -------------------------------------------- */

  /**
   * Sleep wait timer
   * @public
   * @param {number} milliseconds Time in milliseconds to wait
   * @returns {Promise}
   */
  static async sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /* -------------------------------------------- */

  /**
   * Convert a function to a string
   * @public
   * @param {Function} func The function
   * @returns {string}
   */
  static functionToString(func) {
    return `(${func.toString()})()`;
  }

  /* -------------------------------------------- */

  /**
   * Convert a string to a function
   * @public
   * @param {string} string The string
   * @returns {Function}
   */
  static stringToFunction(string) {
    if ( !string ) return;
    // eslint-disable-next-line no-new-func
    const func = Function(string);
    if ( typeof func !== "function" ) {
      return null;
    }
    return func;
  }

  /* -------------------------------------------- */

  /**
   * Lighten or darken colors
   * @public
   * @param color Hex value format: #ffffff, ffffff, #ffffffff or ffffffff
   * @param decimal lighten or darken decimal value, example 0.5 to lighten by 50% or 1.5 to darken by 50%.
   */
  static shadeColor(color, decimal) {
    const base = color.startsWith("#") ? 1 : 0;

    let r = parseInt(color.substring(base, 3), 16);
    let g = parseInt(color.substring(base + 2, 5), 16);
    let b = parseInt(color.substring(base + 4, 7), 16);

    r = Math.round(r / decimal);
    g = Math.round(g / decimal);
    b = Math.round(b / decimal);

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    const rr = ((r.toString(16).length === 1) ? `0${r.toString(16)}` : r.toString(16));
    const gg = ((g.toString(16).length === 1) ? `0${g.toString(16)}` : g.toString(16));
    const bb = ((b.toString(16).length === 1) ? `0${b.toString(16)}` : b.toString(16));
    const aa = color.substring(base + 6, 9);

    return `#${rr}${gg}${bb}${aa}`;
  }

  /* -------------------------------------------- */

  /**
   * Perform a fuzzy match against a string list
   * @public
   * @param {string} stringToMatch
   * @param {string} stringList
   * @returns {string}
   */
  static fuzzyMatch(stringToMatch, stringList) {
    if ( stringToMatch.length < 3 ) return null;
    const matchList = [];
    let elementSub = null;
    for (const element of stringList) {
      elementSub = element;
      let charCount = 0;
      if ( elementSub.length === 0 ) break;
      if ( stringToMatch === element ) return element;
      for (let i = 0; i < stringToMatch.length; i++) {
        const aChar = stringToMatch.charCodeAt(i);
        for (let j = 0; j < element.length; j++) {
          const elementChar = elementSub.charCodeAt(j);
          if ( aChar === elementChar ) {
            charCount++;
            elementSub = elementSub.substring(j);
            break;
          }
        }
      }
      if ( charCount > 0 ) matchList[element] = charCount;
    }
    const maxValueKey = Object.keys(matchList).reduce((a, b) => matchList[a] > matchList[b] ? a : b);
    if ( matchList[maxValueKey] / stringToMatch.length >= 0.7 ) return maxValueKey;
  }
}
