# Bitmovin player React wrapper

# Getting started

- 1. `npm i bitmovin-player-react bitmovin-player bitmovin-player-ui --save`
- 2. Add `import "bitmovin-player-ui/dist/css/bitmovinplayer-ui.css";` to your entrypoint file
- 3. Use the player in your React component:

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
const playerSources: SourceConfig[] = [
  {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
  },
  {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/tos/m3u8/index.m3u8",
  },
];

export function MyComponent() {
  const [playerSource, setPlayerSource] = useState(playerSources[0]);

  useEffect(() => {
    let lastSourceIndex = 0;

    setInterval(() => {
      const newIndex = ++lastSourceIndex % playerSources.length;

      console.log(`Switching to source ${newIndex}`, playerSources[newIndex]);

      setPlayerSource(playerSources[newIndex]);
    }, 15_000);
  }, []);

  return (
    <Fragment>
      <h1>Dynamic source demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

### Avoid source object recreation on every render

```tsx
export function MyComponent() {
  const [_counter, setCounter] = useState(0);

  // This will create a new source object on every render and the player will reload unnecessarily every 500ms.
  const playerSource: SourceConfig = {
    hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
  };

  useEffect(() => {
    setInterval(() => {
      setCounter((previousCounter) => previousCounter + 1);
    }, 500);
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

- Crete a source object outside of the component (refer the "Simple demo" above)
- Use `useState` (refer the "Dynamic source demo" above)
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
    setInterval(() => {
      setCounter((previousCounter) => previousCounter + 1);
    }, 500);
  }, []);

  return (
    <Fragment>
      <h1>Wrong source usage demo</h1>
      <BitmovinPlayer config={playerConfig} source={playerSource} />
    </Fragment>
  );
}
```

# Attach event listeners

# Get access to the player instance

# Customize the player UI

## Use UI container

## Style CSS

## Implement your own UI
