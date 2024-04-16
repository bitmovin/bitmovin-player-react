# Bitmovin player React wrapper

# Getting started

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


# Dynamically update player source config

`BitmovinPlayer` keeps track of the source config and reloads the player when the source config changes:

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

# Attach event listeners

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

# Get player instance

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

# Customize player UI

## Use UI container

You can use `UIContainer` from https://www.npmjs.com/package/bitmovin-player-ui to customize the player UI:

```tsx
import { PlaybackToggleOverlay, UIContainer } from "bitmovin-player-ui";

// Ensure this function returns a new instance of the `UIContainer` on every call.
const uiContainerFactory = () =>
  new UIContainer({
    components: [new PlaybackToggleOverlay()],
  });

export function MyComponent() {
  return (
    <Fragment>
      <h1>UI container demo</h1>
      <BitmovinPlayer
        source={playerSource}
        config={playerConfig}
        customUi={{
          containerFactory: uiContainerFactory,
        }}
      />
    </Fragment>
  );
}
```

## Use UI variants

You can use `UIVariant`s from https://www.npmjs.com/package/bitmovin-player-ui to customize the player UI:

```tsx
import { UIVariant } from "bitmovin-player-ui";

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

export function MyComponent() {
  return (
    <Fragment>
      <h1>UI variants demo</h1>
      <BitmovinPlayer
        source={playerSource}
        config={playerConfig}
        customUi={{
          variantsFactory: uiVariantsFactory,
        }}
      />
    </Fragment>
  );
}
```

## Use custom CSS

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

## Disable UI

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

# Possible pitfalls

## Avoid source object recreation on every render

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
