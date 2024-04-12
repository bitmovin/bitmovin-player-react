import { Player, PlayerAPI, PlayerConfig, SourceConfig } from "bitmovin-player";
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
   * - If the `config.ui` is `false` the UI is disabled.
   *
   * - If the `config.ui` is a truthy value the default `UIFactory.buildDefaultUI` is used from `bitmovin-player-ui`.
   *   The `config.ui` is passed to the internal `UIManager` that initializes UI as UI configuration.
   *   Also 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css' should be included in an entry point file or custom CSS should be implemented.
   *
   * - If the `config.ui` is a truthy value and a UI container factory `ui.containerFactory` or a UI variants factory `ui.variantsFactory` is provided,
   *   it is used instead of the `UIFactory.buildDefaultUI` from `bitmovin-player-ui`.
   *
   *  References:
   *    - https://www.npmjs.com/package/bitmovin-player-ui.
   *    - https://cdn.bitmovin.com/player/web/8/docs/interfaces/Core.PlayerConfig.html#ui.
   * */
  customUi?:
    | {
        containerFactory: () => UIContainer;
      }
    | {
        variantsFactory: () => UIVariant[];
      };
}

export const BitmovinPlayer = forwardRef(function BitmovinPlayer(
  {
    config,
    source,
    className,
    playerRef: playerRefProp,
    customUi,
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
  const isSourceChangedAtLeastOnce = useRef<boolean>(false);

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
        preparePlayerElements(rootContainerElement);

      const convertedConfig = convertConfig(config);
      const initializedPlayer = initializePlayer(
        createdPlayerContainerElement,
        createdVideoElement,
        convertedConfig,
      );

      initializePlayerUi(initializedPlayer, config, customUi);

      if (playerRefProp) {
        setRef(playerRefProp, initializedPlayer);
      }

      setPlayer(initializedPlayer);

      return () => {
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
      setRef(isSourceChangedAtLeastOnce, true);
    } else {
      // Skip unloading the player if the source is empty on mount.
      // This is useful in case users want to use the player instance ref to load the source manually,
      // so this ensures that we do not unload the imperatively loaded source.
      // TODO do we need it?
      //
      // Apart from that, this check ensures that `player.unload` is not called unnecessarily on mount if the source is empty.
      // TODO do we actually care?
      const shouldSkipUnload =
        isInitialSourceEmptyRef.current && !isSourceChangedAtLeastOnce.current;

      if (!shouldSkipUnload) {
        player.unload();
        setRef(isSourceChangedAtLeastOnce, true);
      }
    }
  }, [source, player]);

  return <div className={className} ref={rootContainerElementRefHandler} />;
});

function setRef<T>(ref: RefCallback<T> | MutableRefObject<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else {
    ref.current = value;
  }
}

function initializePlayerUi(
  player: PlayerAPI,
  playerConfig: PlayerConfig,
  customUi?: BitmovinPlayerProps["customUi"],
) {
  if (playerConfig.ui === false) {
    return;
  }

  // If a custom UI container is provided, use it instead of the default UI.
  if (customUi && "containerFactory" in customUi) {
    new UIManager(player, customUi.containerFactory(), playerConfig.ui);
  }
  // If custom UI variants are provided, use them instead of the default UI.
  else if (customUi && "variantsFactory" in customUi) {
    new UIManager(player, customUi.variantsFactory(), playerConfig.ui);
  } else {
    UIFactory.buildDefaultUI(player);
  }
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

function preparePlayerElements(rootContainerElement: HTMLDivElement) {
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
