# Changelog

## 1.0.0 (2023-04-14)


### ⚠ BREAKING CHANGES

* Support circular dependencies with loops of length > 1 (#114)
* Inheritance and reference type search for name filtering (#104)

### Features

* Add `Date` support ([#32](https://www.github.com/daotl/ts-to-effect-schema/issues/32)) ([46d769a](https://www.github.com/daotl/ts-to-effect-schema/commit/46d769ad5b3ab81029cf6d9f504846b784c95f38))
* Add `never` support ([#25](https://www.github.com/daotl/ts-to-effect-schema/issues/25)) ([3267f67](https://www.github.com/daotl/ts-to-effect-schema/commit/3267f67cab2bc2c4793bb7ec340f65dcd0df0a3d))
* Add `skipParseJSDoc` option ([#62](https://www.github.com/daotl/ts-to-effect-schema/issues/62)) ([e48c5fe](https://www.github.com/daotl/ts-to-effect-schema/commit/e48c5fef0bc8cd09a5305b13ea1d62be20d0c5a7))
* add JSDocTag filter ([#72](https://www.github.com/daotl/ts-to-effect-schema/issues/72)) ([5f6bb7f](https://www.github.com/daotl/ts-to-effect-schema/commit/5f6bb7f1004584378ebf0b94637d133b549f1972))
* add support for  `z.set` ([#94](https://www.github.com/daotl/ts-to-effect-schema/issues/94)) ([762c69c](https://www.github.com/daotl/ts-to-effect-schema/commit/762c69c1f8ed89d435251ee415dc7e2249a951f9))
* add support for multiple interface extensions ([#68](https://www.github.com/daotl/ts-to-effect-schema/issues/68)) ([e349c33](https://www.github.com/daotl/ts-to-effect-schema/commit/e349c33de997505da77103555f8d67446983b9f1))
* Add support for unknown type ([#83](https://www.github.com/daotl/ts-to-effect-schema/issues/83)) ([f3bd8e6](https://www.github.com/daotl/ts-to-effect-schema/commit/f3bd8e69ce28e1bd37b742e35ad5049ce6918dec))
* Adds support and test for ReadonlyArray ([#88](https://www.github.com/daotl/ts-to-effect-schema/issues/88)) ([513ebf9](https://www.github.com/daotl/ts-to-effect-schema/commit/513ebf9134375960c721a6acf1ad5a78d1abf92a))
* Adds support for use of enum types as literals and nativeEnums ([#40](https://www.github.com/daotl/ts-to-effect-schema/issues/40)) ([45a64a3](https://www.github.com/daotl/ts-to-effect-schema/commit/45a64a3b180f2668628f72d844855dfda038399c))
* Generate inferred types ([#85](https://www.github.com/daotl/ts-to-effect-schema/issues/85)) ([250f64d](https://www.github.com/daotl/ts-to-effect-schema/commit/250f64d6f6850a15440d3b0f7602c6b92cd173fe))
* Improve nullable ([#57](https://www.github.com/daotl/ts-to-effect-schema/issues/57)) ([0e00f1e](https://www.github.com/daotl/ts-to-effect-schema/commit/0e00f1ea064a3ee01e66ca92260e9adf98407496))
* Inheritance and reference type search for name filtering ([#104](https://www.github.com/daotl/ts-to-effect-schema/issues/104)) ([038b9f6](https://www.github.com/daotl/ts-to-effect-schema/commit/038b9f6c14df79d9fc9756f6c2c21d76e8c46cfe))
* Parse top-level JSDoc tag on `type` ([#59](https://www.github.com/daotl/ts-to-effect-schema/issues/59)) ([33b17f6](https://www.github.com/daotl/ts-to-effect-schema/commit/33b17f6553add96f5d0685d6e800fc892b5bb00a))
* separate type from value and import ([ec47c31](https://www.github.com/daotl/ts-to-effect-schema/commit/ec47c310f56e3a8c14063b83a99295468db37959))
* separate type from value and import ([ba966ab](https://www.github.com/daotl/ts-to-effect-schema/commit/ba966ab43a2f21ff3380d7da8fe055b5faaf6f48))
* support .cjs config extension in ESM packages ([7815ade](https://www.github.com/daotl/ts-to-effect-schema/commit/7815ade629dc962b1885251f264eb261d243a1a2))
* Support `IndexAccessType` ([#51](https://www.github.com/daotl/ts-to-effect-schema/issues/51)) ([2b28266](https://www.github.com/daotl/ts-to-effect-schema/commit/2b2826679353ac3df7848be320b94d8fe2c38092))
* Support circular dependencies with loops of length > 1 ([#114](https://www.github.com/daotl/ts-to-effect-schema/issues/114)) ([b0eb555](https://www.github.com/daotl/ts-to-effect-schema/commit/b0eb555b0e060b5dee18ff41c702e46df6ac1150))
* support custom zod error message ([#73](https://www.github.com/daotl/ts-to-effect-schema/issues/73)) ([36964b3](https://www.github.com/daotl/ts-to-effect-schema/commit/36964b3ed193b775d6d95bb123a03016c9b97915))
* support ESM import (with ".js" extension) ([037811c](https://www.github.com/daotl/ts-to-effect-schema/commit/037811ce0900844065016803dffb555b6317dfc6))
* Support namespace ([#44](https://www.github.com/daotl/ts-to-effect-schema/issues/44)) ([3255083](https://www.github.com/daotl/ts-to-effect-schema/commit/3255083644ded94810c9ea673d14b5a863a10995))
* support standard built-in objects ([7904d0f](https://www.github.com/daotl/ts-to-effect-schema/commit/7904d0f22613b62e92e1f37aa54a1ba8b6886bc3))
* Update to zod 3.0.2 ([f638921](https://www.github.com/daotl/ts-to-effect-schema/commit/f638921f345733752436af53cffa2f2bdaecf903))


### Bug Fixes

* empty interfaces' extends statements are ignored [#108](https://www.github.com/daotl/ts-to-effect-schema/issues/108) ([#109](https://www.github.com/daotl/ts-to-effect-schema/issues/109)) ([4ad2d09](https://www.github.com/daotl/ts-to-effect-schema/commit/4ad2d0962fd1a5efd1b14e4b89d2b642c227649a))
* extends interface inside namespace ([#106](https://www.github.com/daotl/ts-to-effect-schema/issues/106)) ([958d5a5](https://www.github.com/daotl/ts-to-effect-schema/commit/958d5a59e8df9b6f0183f64f794eaf26eb5350a8))
* Fix bad cherry-pick ([ac5af38](https://www.github.com/daotl/ts-to-effect-schema/commit/ac5af38a2737a52b707d287077397c9ad8314b6b))
* Fix nullable ([#92](https://www.github.com/daotl/ts-to-effect-schema/issues/92)) ([f2321a3](https://www.github.com/daotl/ts-to-effect-schema/commit/f2321a355910418ddfb12cb93fcd4b4590469e68))
* Fix optional array ([#20](https://www.github.com/daotl/ts-to-effect-schema/issues/20)) ([ae61041](https://www.github.com/daotl/ts-to-effect-schema/commit/ae610410b1a6d8caeaa4caa614bf2d69613a6f36)), closes [#18](https://www.github.com/daotl/ts-to-effect-schema/issues/18)
* Fix optional function parameter ([#48](https://www.github.com/daotl/ts-to-effect-schema/issues/48)) ([bf0d527](https://www.github.com/daotl/ts-to-effect-schema/commit/bf0d527844ae53e69247b07fde18d4871880b872)), closes [#47](https://www.github.com/daotl/ts-to-effect-schema/issues/47)
* Fix typescript version ([#28](https://www.github.com/daotl/ts-to-effect-schema/issues/28)) ([5bdecbc](https://www.github.com/daotl/ts-to-effect-schema/commit/5bdecbca185622515442b25e8df4c5d7c8b9c88d))
* Fixes [#36](https://www.github.com/daotl/ts-to-effect-schema/issues/36) | Allows for single value unions ([#37](https://www.github.com/daotl/ts-to-effect-schema/issues/37)) ([57a38b2](https://www.github.com/daotl/ts-to-effect-schema/commit/57a38b27b2922f680ad3bbd0ce661e8a27aa5110))
* support numeric literal keys ([#120](https://www.github.com/daotl/ts-to-effect-schema/issues/120)) ([7bbed16](https://www.github.com/daotl/ts-to-effect-schema/commit/7bbed16db6243a7c09312d49d95a5fc61b62ba09))
* union properties can be optional & nullable ([#66](https://www.github.com/daotl/ts-to-effect-schema/issues/66)) ([2ba1838](https://www.github.com/daotl/ts-to-effect-schema/commit/2ba18388a9194f008eac7f522ba4963da65a27f8))
