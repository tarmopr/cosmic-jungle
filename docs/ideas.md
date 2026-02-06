# Space Fantasy Art

Let's vibe and create some art with javascript, html and css. I wat to see some unique color combinations, forms and moving patterns. Space, rainbows and jungle can be an inspiration.

## Ideas:
1. Add some space fantasy characters that randomly appear, move and dissapear. Also make the canvas conerge to more and less dense. Some random turning but not too much of background as well.
2. Add more diverse characters and make the character background transparent, currenctly the background is visible and it is not looking great.
3. Make it interactive, so when I click on a background the show a ripple on purple and other neon colors with random effects.
4. Add interaction with characters - when I click the character then it pops out with some random effect like explosing into pices, dissolving, waving out of existence or like beamed out (star trek).
5. Make the background more diverse and interesting, make it more dynamic and interesting.
6. Characters should have some unique color combinations and patterns. Also show characters in different random sizes not with always the same size.
7. Add some random effects to the background like stars, galaxies, nebulae, etc.
8. Add some random effects to the characters like rainbows, fire, etc.
9. Add some random effects to the particles like stars, galaxies, nebulae, etc.
10. Move the characters with random speed and direction. Use random colors for the character overlay. Use random length trailing for the character.
11. Add parallax effect to the background when mouse is moved. Different characters should move at different speeds and feel like in different distances.
12. [DONE] Add more interesting characters (Owl, Manta, Cat, Dragon) and make them move in different ways (Orbit, Flicker, Follow).
13. [DONE] Add a density slider to the top of the canvas that controls the density of the background and particles.
14. [DONE] Add a speed slider to the top of the canvas that controls the speed of the background and particles.

## Title Box
Move the title box and the reset button to the top of the canvas and make it more transparent and smaller, so that it doesn't cover the canvas. Make it more minimalistic. When mouse is hovered over the title box then it should be highlighted with some neon effect and be less transparent.
Make the titlebox even smaller, and less transparent so that it would not cover the screen in smaller devices.

## Tocuch screen devices
Make the parallax effect work with touchscreen devices like smartphones where mouse is not available.

### Suggested Plan:
1. Consolidate Input: Create a single handleInput(x, y) function that works for both mouse and touch.
2. Add Tilt Mode: Implement a button to "Enable Gyroscope" (to handle the permission requirement).
3. Auto-Drift Toggle: Add a fallback so the parallax "breathes" on its own when idle.
4. Detect if devide has gyroscope and if it is enabled then use the gyroscope to move the background. Remove the tilt mode button.