export const MODULE = {
  ID: 'challenge-tracker'
}

export const SCHEMA = [
  'backgroundImage',
  'closeFunction',
  'frameColor',
  'frameWidth',
  'id',
  'foregroundImage',
  'innerBackgroundColor',
  'innerColor',
  'innerCurrent',
  'innerTotal',
  'listPosition',
  'openFunction',
  'outerBackgroundColor',
  'outerColor',
  'outerCurrent',
  'outerTotal',
  'ownerId',
  'persist',
  'position',
  'scroll',
  'show',
  'size',
  'title',
  'windowed'
]

export const DEFAULTS =
    {
      allowShow: 4,
      backgroundImage: null,
      buttonLocation: 'player-list',
      closeFunction: null,
      debug: false,
      displayButton: 1,
      frameColor: '#0a0d0d',
      frameWidth: 'medium',
      id: null,
      foregroundImage: null,
      innerBackgroundColor: '#b0000066',
      innerColor: '#dc0000ff',
      innerCurrent: 0,
      innerTotal: 0,
      listPosition: null,
      openFunction: null,
      outerBackgroundColor: '#1b6f1b66',
      outerColor: '#228b22ff',
      outerCurrent: 0,
      outerTotal: 4,
      ownerId: null,
      persist: false,
      position: null,
      scroll: true,
      show: false,
      size: 250,
      title: 'challengeTracker.labels.title',
      windowed: false
    }

export const TEMPLATES = {
  challengeTracker: 'modules/challenge-tracker/templates/challenge-tracker.hbs',
  challengeTrackerForm: 'modules/challenge-tracker/templates/challenge-tracker-form.hbs',
  challengeTrackerEditForm: 'modules/challenge-tracker/templates/challenge-tracker-edit-form.hbs'
}
