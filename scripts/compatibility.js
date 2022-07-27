export class ChallengeTrackerCompatibility {
  // Fix for minimal UI's autohide/toggle
  static minmalUiPlayerList (html) {
    if (game.modules.get('minimal-ui').active) {
      const playersListElement = html.find('#player-list')
      const minimalUiPlayerListSetting = game.settings.get('minimal-ui', 'playerList')
      if (minimalUiPlayerListSetting === 'autohide') {
        html.hover(
          () => {
            $('.challenge-tracker-player-list-button').show()
          },
          () => {
            $('.challenge-tracker-player-list-button').hide()
          }
        )
      }
      if (minimalUiPlayerListSetting === 'clicktoggle') {
        let state = 0
        $('.challenge-tracker-player-list-button').hide()
        playersListElement.click(() => {
          if (state === 0) {
            $('.challenge-tracker-player-list-button').show()
            state = 1
          } else {
            $('.challenge-tracker-player-list-button').hide()
            state = 0
          }
        })
      }
    }
  }
}
