Hooks.once("init", async function () {

  game.settings.register("challenge-tracker", "size", {
    name: game.i18n.localize("settings.size.name"),
    hint: game.i18n.localize("settings.size.hint"),
    scope: "world",
    config: true,
    type: Number,
		range: {
			min: 200,
			max: 600,
			step: 50
		},
    default: 400,
		onChange: () => {
			if(game.challengeTracker) ChallengeTracker.drawForEveryone(
				game.challengeTracker.totalSuccess,
				game.challengeTracker.totalFailure,
				game.challengeTracker.currentSuccess,
				game.challengeTracker.currentFailure
			);
		}
  });
});