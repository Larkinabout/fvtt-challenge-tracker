# Challenge Tracker
An interactive aid to track successes and failures in challenges.  

![challenge-tracker](https://user-images.githubusercontent.com/105953297/174775519-3261d0db-57af-483e-a999-31ea3d453c86.png)

## Features
- **Versatile:** Works for D&D 4e-inspired skill challenges, Blades in the Dark progress clocks, or as a resource/countdown tracker.
- **Click to Fill:** Left-click anywhere within the ring or circle to fill a segment in that area. Right-click  to clear a segment.
- **Scroll to Change:** Hover over the ring or circle and use your mouse wheel, or the +/- keys, to increase or decrease the number of segments.
- **Player View:** Click **Show** on the header to show the tracker to your players and click **Hide** to hide it from your players.

## How to Use
1. Create a macro with a Type of 'script' and enter: `ChallengeTracker.open(outer, inner)` where `outer` is the number of segments required on the outer ring (successes) and `inner` is the number of segments required on the inner circle (failures).
2. Execute the macro to open the Challenge Tracker.

## Advanced Options
More options can be set  using an optional array parameter: `ChallengeTracker.open(successes failures, {options})` where options is a comma-separated list of any of the following parameters in the format `option: value`:
- **show:** Set to `true` to show the Challenge Tracker to your players. Default is `false`. Example: `show: true`
- **outerCurrent:** Set the number of completed segments on the outer ring (successes). Default is `0`. Example: `outerCurrent: 3`
- **innerCurrent:** Set the number of completed segments on the inner circle (failures). Default is `0`. Example: `innerCurrent: 3`
- **outerColor:** Set the hex color of the outer ring (successes). The 'Outer Color' module setting will be ignored. Example: `outerColor: '#0000FF'`
- **innerColor:** Set the hex color of the inner circle (failures). The 'Inner Color' module setting will be ignored. Example: `innerColor: '#0000FF'`
- **frameColor:** Set the hex color of the frame. The 'Frame Color' module setting will be ignored. Example: `frameColor: '#0000FF'`
- **size:** Set the size of the Challenge Tracker in pixels between 200 to 600. The 'Size' module setting will be ignored. Example: `size: 400`
- **title:** Set the title of the Challenge Tracker in the window header. Default is `Challenge Tracker`. Example: `title: 'Skill Challenge 1'`  

**Example:** `ChallengeTracker.open(10, 5, {show: true, outerCurrent: 10, innerCurrent: 5, outerColor: '#FF3232', innerColor: '#2180FF', title: 'Health & Mana'})`  

![challenge-tracker-macro](https://user-images.githubusercontent.com/105953297/174798982-53b25513-5aca-464d-9556-1ab7ee543856.png)
