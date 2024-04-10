import { FakePlayer } from "./testUtils/FakePlayer.js";

jest.mock("bitmovin-player", () => {
  return {
    ...jest.requireActual("bitmovin-player"),
    Player: FakePlayer,
  };
});

import { render, waitFor } from "@testing-library/react";
import { PlayerAPI, PlayerConfig, SourceConfig } from "bitmovin-player";
import { PlaybackToggleOverlay, UIContainer } from "bitmovin-player-ui";
import { UIVariant } from "bitmovin-player-ui/dist/js/framework/uimanager.js";
import { MutableRefObject, RefCallback, StrictMode } from "react";

import { BitmovinPlayer } from "./BitmovinPlayer.js";
import { expectNeverOccurs } from "./testUtils/expectNeverOccurs.js";
import { queries } from "./testUtils/queries.js";

const playerConfig: PlayerConfig = {
  key: "<key>",
};

const playerSource: SourceConfig = {
  hls: "https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe(BitmovinPlayer.name, () => {
  it("should render the player", async () => {
    const { getBySelector, getAllBySelector } = render(
      <BitmovinPlayer config={playerConfig} />,
      {
        queries,
      },
    );

    expect(getAllBySelector("video")).toHaveLength(1);
    expect(getBySelector("video")).toBeInTheDocument();
    expect(getBySelector(".fakebitmovinplayer-container")).toBeInTheDocument();
  });

  it("should load the source initially", async () => {
    jest.spyOn(FakePlayer.prototype, "load");

    render(<BitmovinPlayer config={playerConfig} source={playerSource} />);

    await waitFor(() => {
      expect(FakePlayer.prototype.load).toHaveBeenCalled();
    });
  });

  it("should unload the source", async () => {
    jest.spyOn(FakePlayer.prototype, "load");
    jest.spyOn(FakePlayer.prototype, "unload");

    const { rerender } = render(
      <BitmovinPlayer config={playerConfig} source={playerSource} />,
    );

    rerender(<BitmovinPlayer config={playerConfig} source={undefined} />);

    await waitFor(() => {
      expect(FakePlayer.prototype.load).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(FakePlayer.prototype.unload).toHaveBeenCalled();
    });
  });

  it("should not unload the source if it's empty initially", async () => {
    jest.spyOn(FakePlayer.prototype, "unload");

    render(<BitmovinPlayer config={playerConfig} />);

    await expectNeverOccurs(() => {
      expect(FakePlayer.prototype.unload).toHaveBeenCalled();
    });
  });

  it("should destroy the player", () => {
    jest.spyOn(FakePlayer.prototype, "destroy");

    const { unmount } = render(<BitmovinPlayer config={playerConfig} />);

    unmount();

    expect(FakePlayer.prototype.destroy).toHaveBeenCalled();
  });

  describe("UI", () => {
    // Some default UI elements, not the full list.
    const defaultUiElementSelectors = [
      ".bmpui-ui-subtitle-overlay",
      ".bmpui-ui-buffering-overlay",
      ".bmpui-ui-cast-status-overlay",
      ".bmpui-ui-controlbar",
      ".bmpui-ui-titlebar",
      ".bmpui-ui-recommendation-overlay",
      ".bmpui-ui-watermark",
    ];

    it("should initialize the default UI", async () => {
      const { getBySelector } = render(
        <BitmovinPlayer config={playerConfig} />,
        {
          queries,
        },
      );

      defaultUiElementSelectors.forEach((selector) => {
        expect(getBySelector(selector)).toBeInTheDocument();
      });
    });

    it("should initialize the UI using the `UIContainer`", () => {
      const uiContainerFactory = () =>
        new UIContainer({
          components: [new PlaybackToggleOverlay()],
        });

      const { getBySelector } = render(
        <BitmovinPlayer
          config={playerConfig}
          ui={{
            containerFactory: uiContainerFactory,
          }}
        />,
        {
          queries,
        },
      );

      expect(
        getBySelector(".bmpui-ui-hugeplaybacktogglebutton"),
      ).toBeInTheDocument();

      defaultUiElementSelectors.forEach((selector) => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });

    it("should initialize the UI using the `UIVariant[]`", () => {
      const uiVariantsFactory = (): UIVariant[] => [
        {
          ui: new UIContainer({
            components: [new PlaybackToggleOverlay()],
          }),
          condition: (context) => !context.isFullscreen,
        },
      ];

      const { getBySelector } = render(
        <BitmovinPlayer
          config={playerConfig}
          ui={{
            variantsFactory: uiVariantsFactory,
          }}
        />,
        {
          queries,
        },
      );

      expect(
        getBySelector(".bmpui-ui-hugeplaybacktogglebutton"),
      ).toBeInTheDocument();

      defaultUiElementSelectors.forEach((selector) => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });

    it("should not initialize any UI", () => {
      const { getBySelector } = render(
        <BitmovinPlayer config={playerConfig} ui={false} />,
        {
          queries,
        },
      );

      defaultUiElementSelectors.forEach((selector) => {
        expect(getBySelector(selector)).not.toBeInTheDocument();
      });
    });
  });

  describe("Ref", () => {
    it("should initialize the ref", () => {
      const ref: MutableRefObject<HTMLDivElement | null> = {
        current: null,
      };

      render(<BitmovinPlayer config={playerConfig} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should call the ref callback", () => {
      const refCallback: RefCallback<HTMLDivElement> = jest.fn();

      render(<BitmovinPlayer config={playerConfig} ref={refCallback} />);

      expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it("should initialize the player ref", () => {
      const playerRef: MutableRefObject<PlayerAPI | undefined> = {
        current: undefined,
      };

      render(<BitmovinPlayer config={playerConfig} playerRef={playerRef} />);

      expect(playerRef.current).toBeInstanceOf(FakePlayer);
    });

    it("should call the player ref callback", () => {
      const playerRefCallback: RefCallback<PlayerAPI> = jest.fn();

      render(
        <BitmovinPlayer config={playerConfig} playerRef={playerRefCallback} />,
      );

      expect(playerRefCallback).toHaveBeenCalledWith(expect.any(FakePlayer));
    });
  });

  /**
   * @see https://react.dev/reference/react/StrictMode.
   * The biggest challenge for us is that the mount hook is invoked twice (player initialized twice)
   * and that the player destroy method is async.
   */
  describe("Strict mode", () => {
    it("should eventually render only one player in the strict mode", async () => {
      jest.spyOn(FakePlayer.prototype, "destroy");

      const { getBySelector, getAllBySelector } = render(
        <StrictMode>
          <BitmovinPlayer config={playerConfig} />
        </StrictMode>,
        {
          queries,
        },
      );

      const playerContainerElementsBefore = getAllBySelector(
        ".fakebitmovinplayer-container",
      );
      const videoElementsBefore = getAllBySelector("video");

      await FakePlayer.ensureLatestDestroyFinished();

      const videoElementsAfter = getAllBySelector("video");
      const playerContainerElementsAfter = getAllBySelector(
        ".fakebitmovinplayer-container",
      );

      // The player is initialized twice in strict mode because the mount hook is invoked twice.
      // Since the destroy method is async, there can be two container and video elements before the first player is destroyed.
      expect(playerContainerElementsBefore).toHaveLength(2);
      expect(videoElementsBefore).toHaveLength(2);
      // After the first player is destroyed, there should be only one container and video element.
      expect(playerContainerElementsAfter).toHaveLength(1);
      expect(videoElementsAfter).toHaveLength(1);
      expect(getBySelector("video")).toBeInTheDocument();
      expect(FakePlayer.prototype.destroy).toHaveBeenCalledTimes(1);
    });

    it("should not unload the source if it's empty initially", async () => {
      jest.spyOn(FakePlayer.prototype, "unload");

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
