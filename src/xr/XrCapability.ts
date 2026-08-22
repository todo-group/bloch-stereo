export type XrSupportState = "checking" | "supported" | "unsupported";

export async function probeImmersiveVr(xr: XRSystem | undefined = navigator.xr): Promise<XrSupportState> {
  if (!xr) return "unsupported";
  try {
    return (await xr.isSessionSupported("immersive-vr")) ? "supported" : "unsupported";
  } catch {
    return "unsupported";
  }
}
