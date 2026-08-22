import type * as THREE from "three";
import type { BlochSceneContent } from "../stereo/BlochSceneContent";

export type XrQualityLevel = "standard" | "reduced";

export class XrQualityController {
  private lastTime: number | null = null;
  private slowFrames = 0;
  private fastFrames = 0;
  private level: XrQualityLevel = "standard";

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly content: BlochSceneContent,
    private readonly onChange: (level: XrQualityLevel) => void,
  ) {}

  update(time: number) {
    if (this.lastTime === null) {
      this.lastTime = time;
      return;
    }

    const frameTime = time - this.lastTime;
    this.lastTime = time;
    if (frameTime > 15.5) {
      this.slowFrames += 1;
      this.fastFrames = 0;
    } else if (frameTime < 13) {
      this.fastFrames += 1;
      this.slowFrames = Math.max(0, this.slowFrames - 1);
    }

    if (this.level === "standard" && this.slowFrames >= 90) this.setLevel("reduced");
    if (this.level === "reduced" && this.fastFrames >= 360) this.setLevel("standard");
  }

  reset() {
    this.lastTime = null;
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.setLevel("standard");
  }

  private setLevel(level: XrQualityLevel) {
    if (this.level === level) return;
    this.level = level;
    this.content.setDecorativeDetailsVisible(level === "standard");
    this.renderer.xr.setFoveation(level === "standard" ? 0.5 : 0.75);
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.onChange(level);
  }
}
