import {
  Player,
  PlayerAPI,
  PlayerConfig,
  PlayerEvent,
  SourceConfig,
  UIConfig,
} from "bitmovin-player";
import { UIContainer, UIFactory, UIManager } from "bitmovin-player-ui";
import { UIVariant } from "bitmovin-player-ui/dist/js/framework/uimanager";
import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  RefCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface BitmovinPlayerProps {
  /**
   * The following are ignored:
   *  - `config.ui` - use `ui` prop instead, because `config.ui` is always set to `false` internally.
   */
  config: PlayerConfig;
  source?: SourceConfig;
  className?: string;
  playerRef?:
    | MutableRefObject<PlayerAPI | null | undefined>
    | RefCallback<PlayerAPI>;
  ref?:
    | MutableRefObject<HTMLDivElement | null | undefined>
    | RefCallback<HTMLDivElement | null>;
  /**
   * - If `undefined` the default `UIFactory.buildDefaultUI` is used from `bitmovin-player-ui`.
   *   Also 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css' should be included in an entry point file or custom CSS should be implemented.
   *
   * - If `false` the UI is disabled.
   *
   * - If a custom UI container factory `ui.containerFactory` or UI variants factory in `ui.variantsFactory` is provided,
   *   it is used instead of the `UIFactory.buildDefaultUI` from `bitmovin-player-ui`.
   *
   *  References:
   *    - https://www.npmjs.com/package/bitmovin-player-ui.
   * */
  ui?:
    | false
    | {
        containerFactory: () => UIContainer;
        // TODO do we need it?
        config?: UIConfig;
      }
    | {
        variantsFactory: () => UIVariant[];
        // TODO do we need it?
        config?: UIConfig;
      };
}

const noSourceUsedYetSymbol = Symbol("No source used yet");

export const BitmovinPlayer = forwardRef(function BitmovinPlayer(
  {
    config,
    source,
    className,
    playerRef: playerRefProp,
    ui,
  }: BitmovinPlayerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const rootContainerElementRef = useRef<HTMLDivElement | null>(null);
  const rootContainerElementRefHandler = (
    rootContainerElement: HTMLDivElement | null,
  ) => {
    setRef(rootContainerElementRef, rootContainerElement);

    if (forwardedRef) {
      setRef(forwardedRef, rootContainerElement);
    }
  };

  const isInitialSourceEmptyRef = useRef<boolean>(!source);
  const latestUsedSourceRef = useRef<SourceConfig | symbol | undefined>(
    // Source can be `undefined` (request to unload a source),
    // so we use a symbol to explicitly differentiate the case when no source has been used yet.
    noSourceUsedYetSymbol,
  );

  const [player, setPlayer] = useState<PlayerAPI | undefined>();

  // Initialize the player on mount.
  useEffect(
    () => {
      const rootContainerElement = rootContainerElementRef.current;

      if (!rootContainerElement) {
        return;
      }

      // We create elements manually to workaround the React strict mode.
      // In the strict mode the mount hook is invoked twice. Since the destroy method is async
      // the next mount hook is invoked before the previous destroy method is finished and the new player instance
      // messes up the old one. This workaround ensures that each player instance has its own container and video elements.
      // This should be improved in the future if possible.
      const { createdPlayerContainerElement, createdVideoElement } =
        createPlayerElements(rootContainerElement);

      const convertedConfig = convertConfig(config);
      const initializedPlayer = initializePlayer(
        createdPlayerContainerElement,
        createdVideoElement,
        convertedConfig,
      );

      initializePlayerUi(initializedPlayer, ui);

      if (playerRefProp) {
        setRef(playerRefProp, initializedPlayer);
      }

      setPlayer(initializedPlayer);

      return () => {
        setRef(latestUsedSourceRef, noSourceUsedYetSymbol);
        destroyPlayer(
          initializedPlayer,
          rootContainerElement,
          createdPlayerContainerElement,
        );
      };
    },
    // Ignore the dependencies, as the effect should run only once (on mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Load or reload the source.
  useEffect(() => {
    if (!player) {
      return;
    }

    if (source) {
      player.load(source);
    } else {
      // Skip unloading the player if the source is empty on mount.
      // This is useful in case users want to use the player instance ref to load the source manually,
      // so this ensures that we do not unload the imperatively loaded source.
      // TODO do we need it?
      const shouldSkipUnload =
        isInitialSourceEmptyRef.current &&
        latestUsedSourceRef.current === noSourceUsedYetSymbol;

      if (!shouldSkipUnload) {
        player.unload();
      }
    }

    setRef(latestUsedSourceRef, source);
  }, [source, player]);

  return (
    <div
      className={className}
      ref={rootContainerElementRefHandler}
      style={{
        // TODO do we need it? UI is positioned absolutely, so if multiple player instances are used on the same page,
        // their UI might overlap each other without this. Or should it be the user's responsibility to handle it?
        position: "relative",
      }}
    />
  );
});

function setRef<T>(ref: RefCallback<T> | MutableRefObject<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else {
    ref.current = value;
  }
}

function initializePlayerUi(player: PlayerAPI, ui: BitmovinPlayerProps["ui"]) {
  if (ui === false) {
    return;
  }

  let uiManager: UIManager;

  // If a custom UI container is provided, use it instead of the default UI.
  if (ui && "containerFactory" in ui && ui.containerFactory) {
    uiManager = new UIManager(player, ui.containerFactory(), ui?.config);
  }
  // If custom UI variants are provided, use them instead of the default UI.
  else if (ui && "variantsFactory" in ui && ui.variantsFactory) {
    uiManager = new UIManager(player, ui.variantsFactory(), ui?.config);
  } else {
    uiManager = UIFactory.buildDefaultUI(player);
  }

  // TODO should we call `uiManager.release()` when the player is destroyed?
  player.on(PlayerEvent.Destroy, () => {
    uiManager.release();
  });
}

function convertConfig(originalConfig: PlayerConfig) {
  const convertedConfig: PlayerConfig = {
    ...originalConfig,
  };

  // By default Bitmovin player assumes there is `bitmovinplayer-ui.css` and `bitmovinplayer-ui.js` files hosted on the same domain
  // and tries to use them. Since this is a React wrapper it should work standalone.
  // Disable loading the default `bitmovinplayer-ui.css` and `bitmovinplayer-ui.js` from the same domain by the player.
  convertedConfig.ui = false;

  return convertedConfig;
}

function initializePlayer(
  containerElement: HTMLDivElement,
  videoElement: HTMLVideoElement,
  convertedConfig: PlayerConfig,
) {
  const player = new Player(containerElement, convertedConfig);

  player.setVideoElement(videoElement);

  return player;
}

function createPlayerElements(rootContainerElement: HTMLDivElement) {
  const createdPlayerContainerElement = document.createElement("div");
  const createdVideoElement = document.createElement("video");

  rootContainerElement.appendChild(createdPlayerContainerElement);
  createdPlayerContainerElement.appendChild(createdVideoElement);

  return {
    createdPlayerContainerElement,
    createdVideoElement,
  };
}

function destroyPlayer(
  player: PlayerAPI,
  rootContainerElement: HTMLDivElement,
  playerContainerElement: HTMLDivElement,
) {
  playerContainerElement.style.display = "none";

  const removePlayerContainerElement = () => {
    rootContainerElement.removeChild(playerContainerElement);
  };

  player
    .destroy()
    .then(removePlayerContainerElement, removePlayerContainerElement);
}
