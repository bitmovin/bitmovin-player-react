# Bitmovin Player React

This is an open-source project created to enable customers to integrate the Bitmovin Player into React projects. It has been created to provide customers with a starting point, which can be built upon through active collaboration and contributions. We look forward to seeing this library expand and grow.

[![CI](https://github.com/bitmovin/bitmovin-player-react/actions/workflows/ci.yml/badge.svg)](https://github.com/bitmovin/bitmovin-player-react/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Bitmovin Community](https://img.shields.io/discourse/users?label=community&server=https%3A%2F%2Fcommunity.bitmovin.com)](https://community.bitmovin.com/?utm_source=github&utm_medium=bitmovin-player-react&utm_campaign=dev-community)
[![npm version](https://img.shields.io/npm/v/bitmovin-player-react)](https://www.npmjs.com/package/bitmovin-player-react)
[![npm dm](https://img.shields.io/npm/dm/bitmovin-player-react.svg)](https://www.npmjs.com/package/bitmovin-player-react)
[![npm dt](https://img.shields.io/npm/dt/bitmovin-player-react.svg)](https://www.npmjs.com/package/bitmovin-player-react)


# Getting Started

1. `npm i bitmovin-player-react bitmovin-player bitmovin-player-ui --save`
2. Add `import "bitmovin-player-ui/dist/css/bitmovinplayer-ui.css";` to your entry point file
3. Use the player in your React components:

```tsx
import { PlayerConfig, SourceConfig } from "bitmovin-player";
import { BitmovinPlayer } from "bitmovin-player-react";
import { Fragment } from "react";

const playerConfig: PlayerConfig = {
  key: "<key>",
  playback: {
    muted: true,
    autoplay: true,
  },
};

const playerSource: SourceConfig = {
  hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
};

export function MyComponent() {
  return (
    <Fragment>
      <h1>Simple demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

# Documentation

## Dynamically update player source config

`BitmovinPlayer` keeps track of the source config and reloads the player on changes in the source config:

```tsx
const playerSources: Array<SourceConfig | undefined> = [
  {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
  },
  {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/tos/m3u8/index.m3u8",
  },
  // To demonstrate that the source can be unloaded as well.
  undefined,
];

export function MyComponent() {
  const [playerSource, setPlayerSource] = useState(playerSources[0]);

  useEffect(() => {
    let lastSourceIndex = 0;

    const intervalId = setInterval(() => {
      const newIndex = ++lastSourceIndex % playerSources.length;

      console.log(`Switching to source ${newIndex}`, playerSources[newIndex]);

      setPlayerSource(playerSources[newIndex]);
    }, 15_000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Fragment>
      <h1>Dynamic source demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

## Dynamically update player config and UI config

`BitmovinPlayer` keeps track of the player config and UI config and reinitializes the player (destroys the old instance and creates a new one) on changes in the player config or UI config:

```ts
const playerConfigs: Array<PlayerConfig> = [
  {
    key: "<key>",
    playback: {
      autoplay: true,
      muted: true,
    },
  },
  {
    key: "<key>",
    playback: {
      autoplay: false,
      muted: false,
    },
  },
];

export function MyComponent() {
  const [playerConfig, setPlayerConfig] = useState(playerConfigs[0]);

  useEffect(() => {
    let lastConfigIndex = 0;

    const intervalId = setInterval(() => {
      const newIndex = ++lastConfigIndex % playerConfigs.length;

      console.log(`Switching to player config ${newIndex}`, playerConfigs[newIndex]);

      setPlayerConfig(playerConfigs[newIndex]);
    }, 15_000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Fragment>
      <h1>Dynamic source demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

The same applies to the `customUi` object.

## Attach event listeners

```tsx
import { PlayerConfig, PlayerEvent } from "bitmovin-player";

export function MyComponent() {
  const playerConfig: PlayerConfig = {
    key: "<key>",
    playback: {
      muted: true,
      autoplay: true,
    },
    events: {
      [PlayerEvent.Play]: (event) => {
        console.log("Play event fired", event);
      },
    },
  };

  return (
    <Fragment>
      <h1>Events demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

## Get player instance

```tsx
import { PlayerAPI } from "bitmovin-player";

export function MyComponent() {
  const handlePlayerRef = (player: PlayerAPI) => {
    console.log("Player version", player.version);
  };

  return (
    <Fragment>
      <h1>Player instance demo</h1>
      <BitmovinPlayer
        playerRef={handlePlayerRef}
        config={playerConfig}
        source={playerSource}
      />
    </Fragment>
  );
}
```

## Customize player UI

### Use UI container

You can use `UIContainer` from https://www.npmjs.com/package/bitmovin-player-ui to customize the player UI:

```tsx
import { PlaybackToggleOverlay, UIContainer, CustomUi } from "bitmovin-player-ui";

// Ensure this function returns a new instance of the `UIContainer` on every call.
const uiContainerFactory = () =>
  new UIContainer({
    components: [new PlaybackToggleOverlay()],
  });

const customUi: CustomUi = {
  containerFactory: uiContainerFactory
};

export function MyComponent() {
  return (
    <Fragment>
      <h1>UI container demo</h1>
      <BitmovinPlayer
        source={playerSource}
        config={playerConfig}
        customUi={customUi}
      />
    </Fragment>
  );
}
```

### Use UI variants

You can use `UIVariant`s from https://www.npmjs.com/package/bitmovin-player-ui to customize the player UI:

```tsx
import { UIVariant, CustomUi } from "bitmovin-player-ui";

// Ensure this function returns a new instance of the `UIVariant[]` on every call.
const uiVariantsFactory = (): UIVariant[] => [
  {
    ui: new UIContainer({
      components: [
        new PlaybackToggleOverlay(),
        new ControlBar({
          components: [new SeekBar()],
          hidden: false,
        }),
      ],
    }),
    condition: (context) => context.isFullscreen,
  },
  {
    ui: new UIContainer({
      components: [new PlaybackToggleOverlay()],
    }),
    condition: (context) => !context.isFullscreen,
  },
];

const customUi: CustomUi = {
  variantsFactory: uiVariantsFactory
};

export function MyComponent() {
  return (
    <Fragment>
      <h1>UI variants demo</h1>
      <BitmovinPlayer
        source={playerSource}
        config={playerConfig}
        customUi={customUi}
      />
    </Fragment>
  );
}
```

### Use custom CSS

You either can implement your own CSS for the default player UI or build on top of `bitmovin-player-ui/dist/css/bitmovinplayer-ui.css`.

Create a new CSS file:

```css
/* customStyles.css */

.bmpui-ui-playbacktimelabel {
  color: red;
}
```

Import the CSS file:

```tsx
import "./customStyles.css";

export function MyComponent() {
  return (
    <Fragment>
      <h1>Custom CSS demo</h1>
      <BitmovinPlayer source={playerSource} config={playerConfig} />
    </Fragment>
  );
}

```

### Disable UI

```tsx
import { PlayerConfig } from "bitmovin-player";

const playerConfig: PlayerConfig = {
  key: "<key>",
  playback: {
    muted: true,
    autoplay: true,
  },
  // Disable UI
  ui: false,
};

export function MyComponent() {
  return (
    <Fragment>
      <h1>Disable UI demo</h1>
      <BitmovinPlayer
        source={playerSource}
        config={playerConfig}
      />
    </Fragment>
  );
}
```

## Possible pitfalls

### Avoid player config, UI config, and source objects recreation on every render

```tsx
export function MyComponent() {
  const [_counter, setCounter] = useState(0);

  // This will create a new source object on every render and the player will be reloaded unnecessarily.
  const playerSource: SourceConfig = {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCounter((previousCounter) => previousCounter + 1);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Fragment>
      <h1>Wrong source usage demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

Instead do one of the following:

- Create a source object outside of the component (refer to the "Simple demo" above)
- Use `useState` (refer to the "Dynamic source demo" above)
- Use `useMemo`:

The same applies to the `config`, `source`, and `customUi` objects.

```tsx
export function MyComponent() {
  const [_counter, setCounter] = useState(0);

  // Ensure that the source object is created only once.
  const playerSource: SourceConfig = useMemo(
    () => ({
      hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
    }),
    // Add dependencies here if needed to build the source object.
    [],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCounter((previousCounter) => previousCounter + 1);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Fragment>
      <h1>Right source usage demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

# Maintenance and Updates

As an open source project, this library is not part of a regular maintenance or update schedule and is updated on an adhoc basis when contributions are made.

# Contributing to this project

We are pleased to accept changes, updates and fixes from the community wishing to use and expand this project. Bitmovin will review any Pull Requests made. We do our best to provide timely feedback, but please note that no SLAs apply. New releases are tagged and published on our discretion. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details on how to contribute.

## Raising a Feature Suggestion

If you see something missing that might be useful but are unable to contribute the feature yourself, please feel free to [submit a feature request](https://community.bitmovin.com/t/how-to-submit-a-feature-request-to-us/1463) through the Bitmovin Community. Feature suggestions will be considered by Bitmovin’s Product team for future roadmap plans.

## Reporting a bug

If you come across a bug related to the Bitmovin Player React, please raise this through the support ticketing system accessible in your [Bitmovin Dashboard](https://dashboard.bitmovin.com/support/tickets).

## Support and SLA Disclaimer

As an open-source project and not a core product offering, any request, issue or query related to this project is excluded from any SLA and Support terms that a customer might have with either Bitmovin or another third-party service provider or Company contributing to this project. Any and all updates are purely at the contributor's discretion.

## Need more help?

Should you need further help, please raise your request to your Bitmovin account team. We can assist in a number of ways, from providing you professional services help to putting you in touch with preferred system integrators who can work with you to achieve your goals.
