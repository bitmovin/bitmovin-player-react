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
  source: SourceConfig;
  className?: string;
  latestPlayerRef?: MutableRefObject<PlayerAPI> | RefCallback<PlayerAPI>;
  ref?: MutableRefObject<HTMLDivElement> | RefCallback<HTMLDivElement>;
}

export const BitmovinPlayer = forwardRef(function BitmovinPlayer(
  {
    config,
    source,
    className,
    latestPlayerRef: playerRefProp,
  }: BitmovinPlayerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const containerElementRef = useRef<HTMLDivElement | null>(null);
  const containerElementRefHandler = (element: HTMLDivElement | null) => {
    containerElementRef.current = element;

    if (forwardedRef) {
      setRef(forwardedRef, element);
    }
  };
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const latestPlayerRef = useRef<PlayerAPI | undefined>();
  const [player, setPlayer] = useState<PlayerAPI | undefined>();

  // Initialize the player on mount.
  useEffect(
    () => {
      const containerElement = containerElementRef.current;
      const videoElement = videoElementRef.current;

      if (!containerElement || !videoElement) {
        return;
      }

      const shouldAddDefaultUi = checkShouldAddDefaultUi(config);
      const convertedConfig = convertConfig(config, shouldAddDefaultUi);
      const initializedPlayer = initializePlayer(
        containerElement,
        videoElement,
        convertedConfig,
        shouldAddDefaultUi,
      );

      setRef(latestPlayerRef, initializedPlayer);

      if (playerRefProp) {
        setRef(playerRefProp, initializedPlayer);
      }

      setPlayer(initializedPlayer);

      return () => {
        setRef(latestPlayerRef, undefined);
        initializedPlayer.destroy();
      };
    },
    // Ignore the dependencies, as the effect should run only once (on mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Load or reload the source.
  useEffect(() => {
    if (
      !player ||
      // Ensure that the latest player is used. It might not be the case e.g. in case of hot reloading in Vite.
      latestPlayerRef.current !== player
    ) {
      return;
    }

    player.load(source);
  }, [source, player]);

  return (
    <div
      className={className}
      ref={containerElementRefHandler}
      style={{
        position: "relative",
      }}
    >
      <video ref={videoElementRef} />
    </div>
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
