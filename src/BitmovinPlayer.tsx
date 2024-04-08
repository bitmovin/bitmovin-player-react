import { Player, PlayerAPI, PlayerConfig, SourceConfig } from "bitmovin-player";
import { UIFactory } from "bitmovin-player-ui";
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
  playerRef?: MutableRefObject<PlayerAPI> | RefCallback<PlayerAPI>;
  ref?: MutableRefObject<HTMLDivElement> | RefCallback<HTMLDivElement>;
}

const noSourceUsedYetSymbol = Symbol("No source used yet");

export const BitmovinPlayer = forwardRef(function BitmovinPlayer(
  { config, source, className, playerRef: playerRefProp }: BitmovinPlayerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const rootContainerElementRef = useRef<HTMLDivElement | null>(null);
  const rootContainerElementRefHandler = (
    rootContainerElement: HTMLDivElement | null,
  ) => {
    rootContainerElementRef.current = rootContainerElement;

    if (forwardedRef) {
      setRef(forwardedRef, rootContainerElement);
    }
  };

  const isInitialSourceEmptyRef = useRef<boolean>(!source);
  const latestUsedSourceRef = useRef<SourceConfig | symbol | undefined>(
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

      const shouldAddDefaultUi = checkShouldAddDefaultUi(config);
      const convertedConfig = convertConfig(config, shouldAddDefaultUi);
      const initializedPlayer = initializePlayer(
        createdPlayerContainerElement,
        createdVideoElement,
        convertedConfig,
        shouldAddDefaultUi,
      );

      if (playerRefProp) {
        setRef(playerRefProp, initializedPlayer);
      }

      setPlayer(initializedPlayer);

      return () => {
        setRef(latestUsedSourceRef, noSourceUsedYetSymbol);

        createdPlayerContainerElement.style.display = "none";

        const removeOldPlayerContainerElement = () => {
          rootContainerElement.removeChild(createdPlayerContainerElement);
        };

        initializedPlayer
          .destroy()
          .then(
            removeOldPlayerContainerElement,
            removeOldPlayerContainerElement,
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
      // This is useful in case users want to use the player instance ref to load the source manually.
      // TODO do we need it?
      const shouldSkipUnload =
        isInitialSourceEmptyRef.current &&
        latestUsedSourceRef.current === noSourceUsedYetSymbol;

      if (!shouldSkipUnload) {
        player.unload();
      }
    }

    latestUsedSourceRef.current = source;
  }, [source, player]);

  return (
    <div
      className={className}
      ref={rootContainerElementRefHandler}
      style={{
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

// By default Bitmovin player assumes there is `bitmovinplayer-ui.css` and `bitmovinplayer-ui.js` files hosted on the same domain
// and tries to use them. Since this is a React wrapper it should work standalone, so if the user does not provide the `ui` boolean flag
// or if it's `true` we assume they want a default UI.
function checkShouldAddDefaultUi(config: PlayerConfig) {
  return Boolean(!("ui" in config) || config.ui);
}

function convertConfig(
  originalConfig: PlayerConfig,
  shouldAddDefaultUi: boolean,
) {
  const convertedConfig: PlayerConfig = {
    ...originalConfig,
  };

  // Dependencies are used from the package.json file, we do not support custom file locations.
  delete originalConfig.location;

  if (shouldAddDefaultUi) {
    // Disable loading the default `bitmovinplayer-ui.css` and `bitmovinplayer-ui.js` from the same domain.
    convertedConfig.ui = false;
  }

  return convertedConfig;
}

function initializePlayer(
  containerElement: HTMLDivElement,
  videoElement: HTMLVideoElement,
  convertedConfig: PlayerConfig,
  shouldAddDefaultUi: boolean,
) {
  const player = new Player(containerElement, convertedConfig);

  player.setVideoElement(videoElement);

  if (shouldAddDefaultUi) {
    // Users should include 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css' in their project,
    // or provide their custom CSS.
    UIFactory.buildDefaultUI(player);
  }

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
