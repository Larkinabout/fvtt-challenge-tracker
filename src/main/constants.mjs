export const MODULE = {
  ID: "challenge-tracker"
};

/* -------------------------------------------- */

export const SCHEMA = [
  "backgroundImage",
  "closeFunction",
  "frameColor",
  "frameWidth",
  "id",
  "foregroundImage",
  "innerBackgroundColor",
  "innerColor",
  "innerCurrent",
  "innerTotal",
  "listPosition",
  "openFunction",
  "outerBackgroundColor",
  "outerColor",
  "outerCurrent",
  "outerTotal",
  "ownerId",
  "persist",
  "position",
  "scroll",
  "show",
  "size",
  "title",
  "windowed"
];

/* -------------------------------------------- */

export const DEFAULTS =
    {
      allowShow: 4,
      backgroundImage: null,
      buttonLocation: "player-list",
      closeFunction: null,
      debug: false,
      displayButton: 1,
      frameColor: "#0a0d0d",
      frameWidth: "medium",
      id: null,
      foregroundImage: null,
      innerBackgroundColor: "#b0000066",
      innerColor: "#dc0000ff",
      innerCurrent: 0,
      innerTotal: 0,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: "#1b6f1b66",
      outerColor: "#228b22ff",
      outerCurrent: 0,
      outerTotal: 4,
      ownerId: null,
      persist: false,
      position: null,
      scroll: true,
      show: false,
      size: 250,
      title: "challengeTracker.labels.title",
      windowed: false
    };

/* -------------------------------------------- */

export const CHALLENGE_TRACKER_ICON = `<svg width="100%" height="100%" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse stroke-width="7" id="outer_circle" cx="50" cy="50" rx="50" ry="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <ellipse stroke-width="7" id="inner_circle" cx="50" cy="50" rx="30" ry="30" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_4" x1="50" x2="50" y1="0" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_5" x1="50" x2="76" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_6" x1="50" x2="24" y1="50" y2="65" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_8" x1="50" x2="50" y1="80" y2="100" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_9" x1="0" x2="20" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
    <line stroke-width="7" id="svg_11" x1="80" x2="100" y1="50" y2="50" stroke="currentColor" fill="none" fill-opacity="0"/>
  </svg>`;

/* -------------------------------------------- */

export const TEMPLATES = {
  challengeTracker: "modules/challenge-tracker/templates/challenge-tracker.hbs",
  challengeTrackerListApp: "modules/challenge-tracker/templates/challenge-tracker-list-app.hbs",
  challengeTrackerEditApp: "modules/challenge-tracker/templates/challenge-tracker-edit-app.hbs"
};
