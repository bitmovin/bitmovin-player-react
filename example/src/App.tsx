import { PlayerConfig, SourceConfig } from 'bitmovin-player';
import { BitmovinPlayer, CustomUi } from 'bitmovin-player-react';
import { ControlBar, PlaybackToggleOverlay, SeekBar, UIContainer, UIVariant } from 'bitmovin-player-ui';
import { Fragment, useState } from 'react';

import { config } from './config.dist.ts';

const defaultPlayerSource: SourceConfig = {
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8',
};

const playerConfig: PlayerConfig = {
  key: config.playerKey,
  playback: {
    muted: true,
    autoplay: true,
  },
};

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
    condition: context => context.isFullscreen,
  },
  {
    ui: new UIContainer({
      components: [new PlaybackToggleOverlay()],
    }),
    condition: context => !context.isFullscreen,
  },
];

const customUi: CustomUi = {
  variantsFactory: uiVariantsFactory,
};

export function App() {
  const [showPlayer, setShowPlayer] = useState(true);

  return (
    <Fragment>
      <h1>Bitmovin Player React Demo</h1>
      <div
        style={{
          position: 'relative',
          maxWidth: '800px',
        }}
      >
        {showPlayer && <BitmovinPlayer source={defaultPlayerSource} config={playerConfig} customUi={customUi} />}
      </div>
      <button onClick={() => setShowPlayer(!showPlayer)}>Toggle Player</button>
    </Fragment>
  );
}
