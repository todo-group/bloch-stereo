import { describe, expect, it, vi } from "vitest";
import type * as THREE from "three";
import type { BlochSceneContent } from "../stereo/BlochSceneContent";
import { XrQualityController } from "./XrQualityController";

describe("XrQualityController", () => {
  it("uses hysteresis when reducing and restoring decorative detail", () => {
    const setFoveation = vi.fn();
    const setDecorativeDetailsVisible = vi.fn();
    const renderer = { xr: { setFoveation } } as unknown as THREE.WebGLRenderer;
    const content = { setDecorativeDetailsVisible } as unknown as BlochSceneContent;
    const onChange = vi.fn();
    const quality = new XrQualityController(renderer, content, onChange);

    quality.update(0);
    for (let frame = 1; frame <= 90; frame += 1) quality.update(frame * 20);
    expect(setDecorativeDetailsVisible).toHaveBeenCalledWith(false);
    expect(setFoveation).toHaveBeenCalledWith(0.75);

    let time = 1800;
    for (let frame = 1; frame <= 360; frame += 1) {
      time += 10;
      quality.update(time);
    }
    expect(setDecorativeDetailsVisible).toHaveBeenLastCalledWith(true);
    expect(setFoveation).toHaveBeenLastCalledWith(0.5);
  });
});
