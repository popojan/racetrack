# racetrack
* another take on turn based racing
* bezier racetrack aka **formulky**, from scratch
* deployed at [bangneki.com](https://bangneki.com/)

## Changelog

### 2020/10/10
* naive A-star like AI bots with limited look-ahead and precision
* grid configuration e.g. [?players=111111101H](https://bangneki.com/?players=111111101H)
  * 0 Empty
  * 1 AI (bot)
  * H Human (player)

### 2019
* new features as opposed to [hraj.si/formulky](https://hraj.si/formulky)
  * mid-track collision avoidance (objective function optimization thanks to [optimization-js](https://github.com/optimization-js/optimization-js#readme))
  * off-track driving allowed - impacts control circle radius
