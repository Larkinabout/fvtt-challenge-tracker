# Challenge Tracker
An interactive aid to track successes and failures in challenges.  

![challenge-tracker](https://user-images.githubusercontent.com/105953297/174775519-3261d0db-57af-483e-a999-31ea3d453c86.png)

## Features
- **Versatile:** Works for D&D 4e-inspired skill challenges, Blades in the Dark progress clocks, or as a resource/countdown tracker.
- **Click to Fill:** Left-click anywhere within the ring or circle to fill a segment in that area. Right-click  to clear a segment.
- **Scroll to Change:** Hover over the ring or circle and use your mouse wheel, or the +/- keys, to increase or decrease the number of segments.
- **Player View:** Click **Show** on the header to show the tracker to your players and click **Hide** to hide it from your players.

## How to Use
1. Create a macro with a Type of 'script' and enter: `ChallengeTracker.open(successes, failures, show)` where `successes` is the number of successes required, `failures` is the number of failures required, and `show` equals `true` to show the tracker to your players or `false` to hide it from your players. `show` is optional and is set to false by default.
2. Execute the macro to open the Challenge Tracker.

![challenge-tracker-macro](https://user-images.githubusercontent.com/105953297/174775545-f3992540-9737-4ab2-b5e0-6be06428c53a.png)

By default, successes are tracked on the outer ring while failures are tracked on the inner circle.

Currently, only the GM can open, control and close the Challenge Tracker. In a future release, I'll add the functionality to hand over the Challenge Tracker to a player.
