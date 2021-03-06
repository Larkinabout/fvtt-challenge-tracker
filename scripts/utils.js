export class Utils {
  static checkAllowShow (userRole) {
    const allowShow = game.settings.get('challenge-tracker', 'allowShow')
    if (userRole >= allowShow) return true
    return false
  }

  static checkUserId (userId) {
    if (game.userId === userId) return true
    return false
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
}
