import {
  LinearFilter,
  Matrix3,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  StereoCamera,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

export class AdjustableAnaglyphEffect {
  readonly colorMatrixLeft = new Matrix3().fromArray([
    0.4561, -0.0400822, -0.0152161,
    0.500484, -0.0378246, -0.0205971,
    0.176381, -0.0157589, -0.00546856,
  ]);

  readonly colorMatrixRight = new Matrix3().fromArray([
    -0.0434706, 0.378476, -0.0721527,
    -0.0879388, 0.73364, -0.112961,
    -0.00155529, -0.0184503, 1.2264,
  ]);

  eyeSeparation = 0.12;
  redGain = 1;
  cyanGain = 0.82;
  isolation = 1;

  private readonly stereo = new StereoCamera();
  private readonly renderTargetLeft: WebGLRenderTarget;
  private readonly renderTargetRight: WebGLRenderTarget;
  private readonly material: ShaderMaterial;
  private readonly quad: FullScreenQuad;

  constructor(private readonly renderer: WebGLRenderer, width = 512, height = 512) {
    const params = { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat };
    this.renderTargetLeft = new WebGLRenderTarget(width, height, params);
    this.renderTargetRight = new WebGLRenderTarget(width, height, params);

    this.material = new ShaderMaterial({
      uniforms: {
        mapLeft: { value: this.renderTargetLeft.texture },
        mapRight: { value: this.renderTargetRight.texture },
        colorMatrixLeft: { value: this.colorMatrixLeft },
        colorMatrixRight: { value: this.colorMatrixRight },
        redGain: { value: this.redGain },
        cyanGain: { value: this.cyanGain },
        isolation: { value: this.isolation },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = vec2(uv.x, uv.y);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D mapLeft;",
        "uniform sampler2D mapRight;",
        "varying vec2 vUv;",
        "uniform mat3 colorMatrixLeft;",
        "uniform mat3 colorMatrixRight;",
        "uniform float redGain;",
        "uniform float cyanGain;",
        "uniform float isolation;",
        "void main() {",
        "  vec4 colorL = texture2D(mapLeft, vUv);",
        "  vec4 colorR = texture2D(mapRight, vUv);",
        "  vec3 dubois = colorMatrixLeft * colorL.rgb + colorMatrixRight * colorR.rgb;",
        "  float leftLuma = dot(colorL.rgb, vec3(0.299, 0.587, 0.114));",
        "  float rightLuma = dot(colorR.rgb, vec3(0.299, 0.587, 0.114));",
        "  vec3 isolated = vec3(leftLuma * redGain, rightLuma * cyanGain, rightLuma * cyanGain);",
        "  vec3 color = clamp(mix(dubois, isolated, isolation), 0.0, 1.0);",
        "  gl_FragColor = vec4(color.r, color.g, color.b, max(colorL.a, colorR.a));",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });
    this.quad = new FullScreenQuad(this.material);
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    const pixelRatio = this.renderer.getPixelRatio();
    this.renderTargetLeft.setSize(width * pixelRatio, height * pixelRatio);
    this.renderTargetRight.setSize(width * pixelRatio, height * pixelRatio);
  }

  render(scene: Scene, camera: PerspectiveCamera) {
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.stereo.eyeSep = this.eyeSeparation;
    this.material.uniforms.redGain.value = this.redGain;
    this.material.uniforms.cyanGain.value = this.cyanGain;
    this.material.uniforms.isolation.value = this.isolation;

    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();

    this.stereo.update(camera);

    this.renderer.setRenderTarget(this.renderTargetLeft);
    this.renderer.clear();
    this.renderer.render(scene, this.stereo.cameraL);

    this.renderer.setRenderTarget(this.renderTargetRight);
    this.renderer.clear();
    this.renderer.render(scene, this.stereo.cameraR);

    this.renderer.setRenderTarget(null);
    this.quad.render(this.renderer);
    this.renderer.setRenderTarget(currentRenderTarget);
  }

  dispose() {
    this.renderTargetLeft.dispose();
    this.renderTargetRight.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
