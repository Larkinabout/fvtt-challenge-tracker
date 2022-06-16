Hooks.once('ready', async function() {
    CONFIG.debug.hooks = true;
    ChallengeTracker.initialise();
});
