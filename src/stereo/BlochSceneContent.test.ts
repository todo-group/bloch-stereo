import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { interpolateBlochVectorInto } from "./BlochSceneContent";

function makeScratch() {
  return {
    fromDirection: new THREE.Vector3(),
    toDirection: new THREE.Vector3(),
    auxiliary: new THREE.Vector3(),
  };
}

describe("interpolateBlochVectorInto", () => {
  it("reuses the provided result while following the shortest spherical path", () => {
    const result = new THREE.Vector3();
    const returned = interpolateBlochVectorInto(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      0.5,
      result,
      makeScratch(),
    );

    expect(returned).toBe(result);
    expect(result.length()).toBeCloseTo(1);
    expect(result.x).toBeCloseTo(Math.SQRT1_2);
    expect(result.y).toBeCloseTo(Math.SQRT1_2);
    expect(result.z).toBeCloseTo(0);
  });

  it("uses a stable great-circle path for antipodal vectors", () => {
    const result = new THREE.Vector3();
    interpolateBlochVectorInto(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      0.5,
      result,
      makeScratch(),
    );

    expect(result.length()).toBeCloseTo(1);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });

  it("interpolates mixed-state vector length without normalization", () => {
    const result = new THREE.Vector3();
    interpolateBlochVectorInto(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0.5, 0),
      0.5,
      result,
      makeScratch(),
    );

    expect(result.length()).toBeCloseTo(0.75);
  });
});
