import { ChallengeTracker } from "../applications/challenge-tracker.mjs";
import { CHALLENGE_TRACKER_ICON, DEFAULTS, TEMPLATES } from "./constants.mjs";
import { Utils } from "./utils.mjs";
import { Settings } from "./settings.mjs";
import { challengeTrackerListApp } from "../applications/challenge-tracker-list-app.mjs";
import { challengeTrackerEditApp } from "../applications/challenge-tracker-edit-app.mjs";
import { ChallengeTrackerFlag } from "./flags.mjs";

Hooks.once("init", async () => {
  Settings.init();
  challengeTrackerListApp.init();
  challengeTrackerEditApp.init();
  Handlebars.registerHelper("ifEquals", function(arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
  });
  await foundry.applications.handlebars.loadTemplates([
    TEMPLATES.challengeTracker,
    TEMPLATES.challengeTrackerListApp,
    TEMPLATES.challengeTrackerEditApp
  ]);
});

/* -------------------------------------------- */

Hooks.once("colorPickerReady", () => {
  Settings.initColorSettings();
});

/* -------------------------------------------- */

Hooks.once("socketlib.ready", () => {
  window.ChallengeTrackerSocket = socketlib.registerModule("challenge-tracker");
  ChallengeTrackerSocket.register("openHandler", ChallengeTracker.openHandler);
  ChallengeTrackerSocket.register("drawHandler", ChallengeTracker.drawHandler);
  ChallengeTrackerSocket.register("closeHandler", ChallengeTracker.closeHandler);
});

/* -------------------------------------------- */

Hooks.once("ready", async () => {
  if ( game.user.isGM ) {
    if ( typeof ColorPicker === "undefined" ) {
      ui.notifications.notify("Challenge Tracker: To use this module, install and enable the 'Color Picker' module.");
    }
  }

  ChallengeTrackerFlag.setOwner();
  ChallengeTrackerFlag.setListPosition();

  // Initialise Challenge Tracker
  game.challengeTracker = [];

  window.ChallengeTracker = {
    open: ChallengeTracker.open,
    setById: ChallengeTracker.setById,
    setByTitle: ChallengeTracker.setByTitle,
    getById: ChallengeTracker.getById,
    getByTitle: ChallengeTracker.getByTitle,
    closeAll: ChallengeTracker.closeAll,
    closeById: ChallengeTracker.closeById,
    closeByTitle: ChallengeTracker.closeByTitle,
    deleteAll: ChallengeTracker.deleteAll,
    deleteById: ChallengeTracker.deleteById,
    deleteByTitle: ChallengeTracker.deleteByTitle,
    show: ChallengeTracker.showByTitle,
    showAll: ChallengeTracker.showAll,
    showById: ChallengeTracker.showById,
    showByTitle: ChallengeTracker.showByTitle,
    hide: ChallengeTracker.hideByTitle,
    hideAll: ChallengeTracker.hideAll,
    hideById: ChallengeTracker.hideById,
    hideByTitle: ChallengeTracker.hideByTitle,
    openList: challengeTrackerListApp.open
  };
});

/* -------------------------------------------- */

Hooks.on("renderPlayerList", (playerList, html) => {
  const buttonLocation = Utils.getSetting("buttonLocation");
  if ( buttonLocation !== "player-list" || !Utils.checkDisplayButton(game.user.role) ) return;
  (async () => {
    // Sleep to let system and modules load elements onto the Player List
    await Utils.sleep(100);

    const icon = CHALLENGE_TRACKER_ICON;

    const listElement = html.find("li");
    for (const element of listElement) {
      const userId = $(element).data().userId;
      if ( game.user.isGM || userId === game.userId ) {
        $(element).append(
          `<button type='button' class='challenge-tracker-player-list-button flex0'>${icon}</button>`
        );
      } else if ( game.system.id === "swade" ) {
        $(element).append(
          "<span class='challenge-tracker-player-list-placeholder flex0'></span>");
      }
    }

    // Add click event to button
    html.on("click", ".challenge-tracker-player-list-button", event => {
      challengeTrackerListApp.openByEvent(event);
    });
  })();
});

/* -------------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  const buttonLocation = Utils.getSetting("buttonLocation", DEFAULTS.buttonLocation);
  if ( !Utils.checkDisplayButton(game.user.role) ) return;
  if ( buttonLocation === "player-list" || buttonLocation === "none" ) return;
  if ( !controls[buttonLocation] ) return;

  const tools = controls[buttonLocation].tools;

  if ( !controls[buttonLocation]._challengeTrackerWrapped ) {
    const originalOnToolChange = controls[buttonLocation].onToolChange;
    controls[buttonLocation].onToolChange = (...args) => {
      if ( typeof originalOnToolChange === "function" ) {
        originalOnToolChange(...args);
      }

      if ( tools.challengeTracker?.active ) {
        tools.challengeTracker.active = false;
        game.challengeTrackerListApp?.close();
      }
    };
  }

  tools.challengeTracker = {
    name: "challengeTracker",
    title: game.i18n.localize("challengeTracker.labels.buttonTitle"),
    icon: "challenge-tracker-control-button",
    onChange: (_event, toggled) => {
      if ( toggled ) {
        challengeTrackerListApp.open();
      } else {
        game.challengeTrackerListApp.close();
      }
    },
    toggle: true
  };

  controls[buttonLocation]._challengeTrackerWrapped = true;
});

/* -------------------------------------------- */

Hooks.on("renderSceneControls", (controls, html) => {
  const controlButton = html.querySelector(".challenge-tracker-control-button");
  if ( !controlButton ) return;
  controlButton.innerHTML = CHALLENGE_TRACKER_ICON;
});

/* -------------------------------------------- */

Hooks.on("renderChallengeTracker", async challengeTracker => {
  if ( !game.challengeTracker ) return;
  challengeTracker._draw();
});

/* -------------------------------------------- */

Hooks.on("closechallengeTrackerListApp", () => {
  const buttonLocation = Utils.getSetting("buttonLocation");
  const controls = ui.controls;
  const controlsControls = controls.controls;
  const control = controlsControls.find(c => c.name === buttonLocation);
  if ( !control ) return;
  const tool = control.tools.find(ct => ct.name === "challenge-tracker");
  if ( !tool ) return;
  tool.active = false;
  controls.render();
});
