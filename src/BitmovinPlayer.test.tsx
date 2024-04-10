import { FakePlayer } from "./testUtils/FakePlayer.js";

jest.mock("bitmovin-player", () => {
  return {
    ...jest.requireActual("bitmovin-player"),
    Player: FakePlayer,
  };
});

import { render } from "@testing-library/react";
import { PlayerConfig } from "bitmovin-player";
import { StrictMode } from "react";

import { BitmovinPlayer } from "./BitmovinPlayer.js";
import { queries } from "./testUtils/queries.js";

const playerConfig: PlayerConfig = {
  key: "<key>",
};

describe(BitmovinPlayer.name, () => {
  it("should render player", async () => {
    const { getByTagName, getAllByTagName } = render(
      <BitmovinPlayer config={playerConfig} />,
      {
        queries,
      },
    );

    expect(getAllByTagName("video")).toHaveLength(1);
    expect(getByTagName("video")).toBeInTheDocument();
  });

  /**
   * @see https://react.dev/reference/react/StrictMode.
   * The biggest challenge for us is that the did mount hook is invoked twice
   * and that the player destroy method is async.
   */
  describe("Strict mode", () => {
    it("should eventually render player in strict mode", async () => {
      const { getByTagName, getAllByTagName } = render(
        <StrictMode>
          <BitmovinPlayer config={playerConfig} />
        </StrictMode>,
        {
          queries,
        },
      );

      const videoElementsBefore = getAllByTagName("video");

      await FakePlayer.ensureLatestDestroyFinished();

      const videoElementsAfter = getAllByTagName("video");

      // The player is initialized twice in strict mode.
      // So there can be two video elements before the first player is destroyed.
      expect(videoElementsBefore).toHaveLength(2);
      // After the first player is destroyed, there should be only one video element.
      expect(videoElementsAfter).toHaveLength(1);
      expect(getByTagName("video")).toBeInTheDocument();
    });
  });
});
