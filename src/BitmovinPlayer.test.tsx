import { FakePlayer } from './testUtils/FakePlayer.js';

jest.mock('bitmovin-player', () => {
  return {
    ...jest.requireActual('bitmovin-player'),
    Player: FakePlayer,
  };
});

import { render, waitFor } from '@testing-library/react';
import { PlayerAPI, PlayerConfig, SourceConfig } from 'bitmovin-player';
import { PlaybackToggleOverlay, TitleBar, UIContainer } from 'bitmovin-player-ui';
import { UIManager, UIVariant } from 'bitmovin-player-ui/dist/js/framework/uimanager.js';
import { MutableRefObject, RefCallback, StrictMode } from 'react';

import { BitmovinPlayer } from './BitmovinPlayer.js';
import { expectNeverOccurs } from './testUtils/expectNeverOccurs.js';
import { queries } from './testUtils/queries.js';

const playerConfig: PlayerConfig = {
  key: '<key>',
};

const playerSource: SourceConfig = {
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BitmovinPlayer', () => {
  describe('Player config', () => {
    it('should render the player on mount', async () => {
      const { getBySelector, getAllBySelector } = render(<BitmovinPlayer config={playerConfig} />, {
        queries,
      });

      expect(getAllBySelector('video')).toHaveLength(1);
      expect(getBySelector('video')).toBeInTheDocument();
      expect(getBySelector(`.${FakePlayer.containerClassName}`)).toBeInTheDocument();
    });

    it('should destroy the player on unmount', () => {
      jest.spyOn(FakePlayer.prototype, 'destroy');

      const { unmount } = render(<BitmovinPlayer config={playerConfig} />);

      unmount();

      expect(FakePlayer.prototype.destroy).toHaveBeenCalled();
    });

    it('should reinitialize the player on changes in the player config', async () => {
      jest.spyOn(FakePlayer.prototype, 'destroy');

      const { getBySelector, rerender } = render(<BitmovinPlayer config={playerConfig} />, {
        queries,
      });

      rerender(<BitmovinPlayer config={{ ...playerConfig }} />);

      await FakePlayer.ensureLatestDestroyFinished();

      expect(FakePlayer.prototype.destroy).toHaveBeenCalled();
      expect(getBySelector(`.${FakePlayer.containerClassName}`)).toBeInTheDocument();
    });
  });

  describe('Source config', () => {
    it('should load the source initially', async () => {
      jest.spyOn(FakePlayer.prototype, 'load');

      render(<BitmovinPlayer config={playerConfig} source={playerSource} />);

      await waitFor(() => {
        expect(FakePlayer.prototype.load).toHaveBeenCalled();
      });
    });

    it('should unload the source', async () => {
      jest.spyOn(FakePlayer.prototype, 'load');
      jest.spyOn(FakePlayer.prototype, 'unload');

      const { rerender } = render(<BitmovinPlayer config={playerConfig} source={playerSource} />);

      rerender(<BitmovinPlayer config={playerConfig} source={undefined} />);

      await waitFor(() => {
        expect(FakePlayer.prototype.load).toHaveBeenCalled();
        expect(FakePlayer.prototype.unload).toHaveBeenCalled();
      });
    });

    it("should not unload the source if it's empty initially", async () => {
      jest.spyOn(FakePlayer.prototype, 'unload');

      render(<BitmovinPlayer config={playerConfig} />);

      await expectNeverOccurs(() => {
        expect(FakePlayer.prototype.unload).toHaveBeenCalled();
      });
    });

    it('should load the source again on changes in the player config', async () => {
      jest.spyOn(FakePlayer.prototype, 'load');
      jest.spyOn(FakePlayer.prototype, 'unload');

      const { rerender } = render(<BitmovinPlayer config={playerConfig} source={playerSource} />, {
        queries,
      });

      rerender(<BitmovinPlayer config={{ ...playerConfig }} source={playerSource} />);

      await waitFor(() => {
        expect(FakePlayer.prototype.load).toHaveBeenCalledTimes(2);
        // The player is simply destroyer, so the `unload` should not be invoked.
        expect(FakePlayer.prototype.unload).not.toHaveBeenCalled();
      });
    });
  });

  describe('UI', () => {
    // Some default UI elements, not the full list.
    const defaultUiElementSelectors = [
      '.bmpui-ui-subtitle-overlay',
      '.bmpui-ui-buffering-overlay',
      '.bmpui-ui-cast-status-overlay',
      '.bmpui-ui-controlbar',
      '.bmpui-ui-titlebar',
      '.bmpui-ui-recommendation-overlay',
      '.bmpui-ui-watermark',
    ];

    it('should initialize the default UI', async () => {
      const { getBySelector } = render(<BitmovinPlayer config={playerConfig} />, {
        queries,
      });

      defaultUiElementSelectors.forEach(selector => {
        expect(getBySelector(selector)).toBeInTheDocument();
      });
    });

    it('should initialize the default UI with the provided UI config', () => {
      const { getBySelector } = render(
        <BitmovinPlayer
          config={{
            ...playerConfig,
            ui: {
              metadata: {
                title: 'Sintel',
                description: 'A short film by Blender Foundation',
              },
            },
          }}
        />,
        {
          queries,
        },
      );

      expect(getBySelector('.bmpui-ui-titlebar')).toBeInTheDocument();

      expect(getBySelector('.bmpui-label-metadata-title')).toBeInTheDocument();
      expect(getBySelector('.bmpui-label-metadata-title')).toHaveTextContent('Sintel');

      expect(getBySelector('.bmpui-label-metadata-description')).toBeInTheDocument();
      expect(getBySelector('.bmpui-label-metadata-description')).toHaveTextContent(
        'A short film by Blender Foundation',
      );
    });

    it('should initialize the UI using the `UIContainer`', () => {
      const uiContainerFactory = () =>
        new UIContainer({
          components: [new PlaybackToggleOverlay()],
        });

      const { getBySelector } = render(
        <BitmovinPlayer
          config={playerConfig}
          customUi={{
            containerFactory: uiContainerFactory,
          }}
        />,
        {
          queries,
        },
      );

      expect(getBySelector('.bmpui-ui-hugeplaybacktogglebutton')).toBeInTheDocument();

      defaultUiElementSelectors.forEach(selector => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });

    it('should initialize the UI using the `UIVariant[]`', () => {
      const uiVariantsFactory = (): UIVariant[] => [
        {
          ui: new UIContainer({
            components: [new PlaybackToggleOverlay()],
          }),
          condition: context => !context.isFullscreen,
        },
      ];

      const { getBySelector } = render(
        <BitmovinPlayer
          config={playerConfig}
          customUi={{
            variantsFactory: uiVariantsFactory,
          }}
        />,
        {
          queries,
        },
      );

      expect(getBySelector('.bmpui-ui-hugeplaybacktogglebutton')).toBeInTheDocument();

      defaultUiElementSelectors.forEach(selector => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });

    it('should initialize the custom UI with the provided UI config', () => {
      const uiContainerFactory = () =>
        new UIContainer({
          components: [new TitleBar()],
        });

      const { getBySelector } = render(
        <BitmovinPlayer
          config={{
            ...playerConfig,
            ui: {
              metadata: {
                title: 'Sintel',
                description: 'A short film by Blender Foundation',
              },
            },
          }}
          customUi={{
            containerFactory: uiContainerFactory,
          }}
        />,
        {
          queries,
        },
      );

      expect(getBySelector('.bmpui-ui-titlebar')).toBeInTheDocument();

      expect(getBySelector('.bmpui-label-metadata-title')).toBeInTheDocument();
      expect(getBySelector('.bmpui-label-metadata-title')).toHaveTextContent('Sintel');

      expect(getBySelector('.bmpui-label-metadata-description')).toBeInTheDocument();
      expect(getBySelector('.bmpui-label-metadata-description')).toHaveTextContent(
        'A short film by Blender Foundation',
      );
    });

    it('should not initialize any UI', () => {
      const { getBySelector } = render(
        <BitmovinPlayer
          config={{
            ...playerConfig,
            ui: false,
          }}
        />,
        {
          queries,
        },
      );

      defaultUiElementSelectors.forEach(selector => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });

    describe('Cleanup', () => {
      it('should properly clean up the UI manager before destroying the player', async () => {
        const uiManagerReleaseSpy = jest.spyOn(UIManager.prototype, 'release');
        const playerDestroySpy = jest.spyOn(FakePlayer.prototype, 'destroy');

        const { unmount } = render(<BitmovinPlayer config={playerConfig} />);

        unmount();

        // Verify that release() is called before destroy()
        expect(uiManagerReleaseSpy).toHaveBeenCalledTimes(1);
        expect(playerDestroySpy).toHaveBeenCalledTimes(1);
        expect(uiManagerReleaseSpy.mock.invocationCallOrder[0]).toBeLessThan(
          playerDestroySpy.mock.invocationCallOrder[0],
        );
      });

      it('should not attempt to release UI manager if UI is disabled', () => {
        const uiManagerReleaseSpy = jest.spyOn(UIManager.prototype, 'release');

        const { unmount } = render(
          <BitmovinPlayer
            config={{
              ...playerConfig,
              ui: false,
            }}
          />,
        );

        unmount();

        expect(uiManagerReleaseSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Ref', () => {
    it('should initialize the ref', () => {
      const ref: MutableRefObject<HTMLDivElement | null> = {
        current: null,
      };

      render(<BitmovinPlayer config={playerConfig} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should call the ref callback', () => {
      const refCallback: RefCallback<HTMLDivElement> = jest.fn();

      render(<BitmovinPlayer config={playerConfig} ref={refCallback} />);

      expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('should initialize the player ref', () => {
      const playerRef: MutableRefObject<PlayerAPI | undefined> = {
        current: undefined,
      };

      render(<BitmovinPlayer config={playerConfig} playerRef={playerRef} />);

      expect(playerRef.current).toBeInstanceOf(FakePlayer);
    });

    it('should call the player ref callback', () => {
      const playerRefCallback: RefCallback<PlayerAPI> = jest.fn();

      render(<BitmovinPlayer config={playerConfig} playerRef={playerRefCallback} />);

      expect(playerRefCallback).toHaveBeenCalledWith(expect.any(FakePlayer));
    });

    it('should not reinitialize the player on ref changes', () => {
      jest.spyOn(FakePlayer.prototype, 'destroy');

      const playerRefCallback: RefCallback<PlayerAPI> = jest.fn();

      const { rerender } = render(<BitmovinPlayer config={playerConfig} playerRef={playerRefCallback} />);

      rerender(<BitmovinPlayer config={playerConfig} playerRef={undefined} />);
      rerender(<BitmovinPlayer config={playerConfig} playerRef={playerRefCallback} />);

      expect(playerRefCallback).toHaveBeenCalledWith(expect.any(FakePlayer));
      expect(playerRefCallback).toHaveBeenCalledTimes(1);
      expect(FakePlayer.prototype.destroy).not.toHaveBeenCalled();
    });
  });

  /**
   * @see https://react.dev/reference/react/StrictMode.
   * The biggest challenge for us is that the mount hook is invoked twice (player initialized twice)
   * and that the player destroy method is async.
   */
  describe('Strict mode', () => {
    it('should eventually render only one player in the strict mode', async () => {
      jest.spyOn(FakePlayer.prototype, 'destroy');

      const { getBySelector, getAllBySelector } = render(
        <StrictMode>
          <BitmovinPlayer config={playerConfig} />
        </StrictMode>,
        {
          queries,
        },
      );

      const playerContainerElementsBefore = getAllBySelector(`.${FakePlayer.containerClassName}`);
      const videoElementsBefore = getAllBySelector('video');

      await FakePlayer.ensureLatestDestroyFinished();

      const videoElementsAfter = getAllBySelector('video');
      const playerContainerElementsAfter = getAllBySelector(`.${FakePlayer.containerClassName}`);

      // The player is initialized twice in strict mode because the mount hook is invoked twice.
      // Since the destroy method is async, there can be two container and video elements before the first player is destroyed.
      expect(playerContainerElementsBefore).toHaveLength(2);
      expect(videoElementsBefore).toHaveLength(2);
      // After the first player is destroyed, there should be only one container and video element.
      expect(playerContainerElementsAfter).toHaveLength(1);
      expect(videoElementsAfter).toHaveLength(1);
      expect(getBySelector('video')).toBeInTheDocument();
      expect(FakePlayer.prototype.destroy).toHaveBeenCalledTimes(1);
    });

    it("should not unload the source if it's empty initially", async () => {
      jest.spyOn(FakePlayer.prototype, 'unload');

      render(
        <StrictMode>
          <BitmovinPlayer config={playerConfig} />
        </StrictMode>,
      );

      await expectNeverOccurs(() => {
        expect(FakePlayer.prototype.unload).toHaveBeenCalled();
      });
    });
  });
});
