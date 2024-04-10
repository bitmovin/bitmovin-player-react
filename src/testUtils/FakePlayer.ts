// Use types from `PlayerModule`.
import * as PlayerModule from "bitmovin-player";
// Import explicitly since this is not available in the DOM environment globally.
import { setImmediate } from "timers";

// Use values from `playerExports`.
const { Player: _Player, ...playerExports } =
  jest.requireActual<typeof PlayerModule>("bitmovin-player");

export class FakePlayer
  implements
    Pick<
      PlayerModule.PlayerAPI,
      | "on"
      | "load"
      | "getSource"
      | "unload"
      | "getVideoElement"
      | "setVideoElement"
      | "getVolume"
      | "exports"
      | "getContainer"
      | "getViewMode"
      | "isPlaying"
      | "isStalled"
      | "isCasting"
      | "isLive"
      | "getConfig"
      | "getAvailableAudio"
      | "getAudio"
      | "getDuration"
      | "getCurrentTime"
      | "getSeekableRange"
      | "getVideoBufferLength"
      | "getAudioBufferLength"
      | "isPaused"
      | "isMuted"
      | "isViewModeAvailable"
      | "isCastAvailable"
      | "destroy"
    >
{
  private videoElement?: HTMLVideoElement;

  private source?: PlayerModule.SourceConfig;

  readonly exports = playerExports;

  constructor(
    private readonly containerElement: HTMLElement,
    private readonly config: PlayerModule.PlayerConfig,
  ) {}

  on() {}

  getContainer() {
    return this.containerElement;
  }

  async load(source: PlayerModule.SourceConfig) {
    this.source = source;
    await processPromiseQueue();
  }

  getConfig() {
    return this.config;
  }

  getSource() {
    return this.source || null;
  }

  async unload() {
    await processPromiseQueue();
  }

  setVideoElement(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  getVideoElement() {
    if (!this.videoElement) {
      throw new Error("Video element is not set");
    }

    return this.videoElement;
  }

  getVolume() {
    return 0;
  }

  getViewMode() {
    return playerExports.ViewMode.Inline;
  }

  isPlaying() {
    return false;
  }

  isStalled() {
    return false;
  }

  isCasting() {
    return false;
  }

  isLive() {
    return false;
  }

  getAvailableAudio() {
    return [];
  }

  getAudio() {
    return null;
  }

  getDuration() {
    return 0;
  }

  getCurrentTime() {
    return 0;
  }

  getSeekableRange() {
    return { start: 0, end: 0 };
  }

  getVideoBufferLength() {
    return 0;
  }

  getAudioBufferLength() {
    return 0;
  }

  isPaused() {
    return true;
  }

  isMuted() {
    return true;
  }

  isViewModeAvailable() {
    return false;
  }

  isCastAvailable() {
    return false;
  }

  async destroy() {
    await processPromiseQueue();
  }

  /** Test utils **/

  // Since the mocked `destroy` method simply resolves after the promise queue has been processed,
  // this method is enough to ensure that the player has been destroyed.
  static async ensureLatestDestroyFinished() {
    await processPromiseQueue();
  }
}

/**
 * Returns a promise that resolves after all promises on the microtask queue that are ready to process have
 * been processed. This works by putting a callback onto the event queue and resolving afterwards.
 */
export function processPromiseQueue() {
  return new Promise((resolve) => setImmediate(resolve));
}
