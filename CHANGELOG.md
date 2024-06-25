# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 1.0.0 - 2024-06-25

### Added

- Initial React wrapper implementation ([#1](https://github.com/bitmovin/bitmovin-player-react/pull/1))
- CI workflow ([#2](https://github.com/bitmovin/bitmovin-player-react/pull/2))
- Release workflow ([#3](https://github.com/bitmovin/bitmovin-player-react/pull/3))
- Skip CHANGELOG update option to the release workflow  ([#6](https://github.com/bitmovin/bitmovin-player-react/pull/6))
- Pre-commit hook for linting ([#9](https://github.com/bitmovin/bitmovin-player-react/pull/9))
- Example ([#10](https://github.com/bitmovin/bitmovin-player-react/pull/10))
- Contribution guide ([#10](https://github.com/bitmovin/bitmovin-player-react/pull/10))
- Issue template ([#10](https://github.com/bitmovin/bitmovin-player-react/pull/10))
- Reinitialize the player on changes in the player config or UI config ([#12](https://github.com/bitmovin/bitmovin-player-react/pull/12))

### Changed

- Improve `UIVariant` imports ([#4](https://github.com/bitmovin/bitmovin-player-react/pull/4))
- Include React 18 in peer dependencies ([#5](https://github.com/bitmovin/bitmovin-player-react/pull/5))
- Safe NPM login in the release workflow ([#7](https://github.com/bitmovin/bitmovin-player-react/pull/7))

### Fixed

- HMR breaks rendering ([#8](https://github.com/bitmovin/bitmovin-player-react/pull/8))
- Use the initial player ref to avoid redundant callbacks ([#14](https://github.com/bitmovin/bitmovin-player-react/pull/14))
