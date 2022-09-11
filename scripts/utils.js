import { ChallengeTrackerSettings } from './main.js'

export class Utils {
  static checkAllowShow (userRole) {
    const allowShow = Utils.getSetting('challenge-tracker', 'allowShow', ChallengeTrackerSettings.default.allowShow)
    if (userRole >= allowShow) return true
    return false
  }

  static checkDisplayButton (userRole) {
    const displayButton = Utils.getSetting('challenge-tracker', 'displayButton', ChallengeTrackerSettings.default.displayButton)
    if (userRole >= displayButton) return true
    return false
  }

  static checkUserId (userId) {
    if (game.userId === userId) return true
    return false
  }

  static getSetting (namespace, key, defaultValue = null) {
    let value = defaultValue ?? null
    if (game.settings.settings.get(`${namespace}.${key}`)) {
      value = game.settings.get(namespace, key)
    }
    return value
  }

  static async sleep (milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

  static functionToString (func) {
    return `(${func.toString()})()`
  }

  static stringToFunction (string) {
    if (!string) return
    // eslint-disable-next-line no-new-func
    const func = Function(string)
    if (typeof func !== 'function') {
      return null
    }
    return func
  }

  /**
  * @param color Hex value format: #ffffff, ffffff, #ffffffff or ffffffff
  * @param decimal lighten or darken decimal value, example 0.5 to lighten by 50% or 1.5 to darken by 50%.
  **/
  static shadeColor (color, decimal) {
    const base = color.startsWith('#') ? 1 : 0

    let r = parseInt(color.substring(base, 3), 16)
    let g = parseInt(color.substring(base + 2, 5), 16)
    let b = parseInt(color.substring(base + 4, 7), 16)

    r = Math.round(r / decimal)
    g = Math.round(g / decimal)
    b = Math.round(b / decimal)

    r = (r < 255) ? r : 255
    g = (g < 255) ? g : 255
    b = (b < 255) ? b : 255

    const rr = ((r.toString(16).length === 1) ? `0${r.toString(16)}` : r.toString(16))
    const gg = ((g.toString(16).length === 1) ? `0${g.toString(16)}` : g.toString(16))
    const bb = ((b.toString(16).length === 1) ? `0${b.toString(16)}` : b.toString(16))
    const aa = color.substring(base + 6, 9)

    return `#${rr}${gg}${bb}${aa}`
  }

  static fuzzyMatch (a, b) {
    if (a.length < 3) return null
    const matchList = []
    let elementSub = null
    for (const element of b) {
      elementSub = element
      let charCount = 0
      if (elementSub.length === 0) break
      if (a === element) return element
      for (let i = 0; i < a.length; i++) {
        const aChar = a.charCodeAt(i)
        for (let j = 0; j < element.length; j++) {
          const elementChar = elementSub.charCodeAt(j)
          if (aChar === elementChar) {
            charCount++
            elementSub = elementSub.substring(j)
            break
          }
        }
      }
      if (charCount > 0) matchList[element] = charCount
    }
    const maxValueKey = getMaxValueKey(matchList)
    if (matchList[maxValueKey] / a.length >= 0.7) return maxValueKey
  }
}

function getMaxValueKey (obj) {
  return Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b)
}
