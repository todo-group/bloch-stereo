import { describe, expect, it, vi } from "vitest";
import { probeImmersiveVr } from "./XrCapability";

describe("probeImmersiveVr", () => {
  it("reports supported only when immersive-vr is available", async () => {
    const xr = { isSessionSupported: vi.fn().mockResolvedValue(true) } as unknown as XRSystem;
    await expect(probeImmersiveVr(xr)).resolves.toBe("supported");
    expect(xr.isSessionSupported).toHaveBeenCalledWith("immersive-vr");
  });

  it("falls back to unsupported when the probe fails", async () => {
    const xr = { isSessionSupported: vi.fn().mockRejectedValue(new Error("denied")) } as unknown as XRSystem;
    await expect(probeImmersiveVr(xr)).resolves.toBe("unsupported");
    await expect(probeImmersiveVr(undefined)).resolves.toBe("unsupported");
  });
});
