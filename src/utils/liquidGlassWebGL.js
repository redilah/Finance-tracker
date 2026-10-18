// ============================================================================
// Apple iOS 26 / visionOS "Liquid Glass" — WebGL2 GLSL + 3D Meniscus Lens Engine
// ============================================================================
// Pure Luminous Crystal Optics: 3D Signed Distance Field (SDF) capsule dome,
// hydrodynamic velocity teardrop deformation, analytical 3D surface normals,
// hardware Snell's Law refraction (refract(), n = 1.52 Crown Crystal),
// Schlick's Fresnel equation, PBR Blinn-Phong specular dome lighting,
// and Procedural 3D Capsule Meniscus Barrel Displacement Map for real icon/text
// edge warping ("menu naik ke depan & melengkung di tepi kaca").
// Strictly ZERO dark/black smudges, ZERO blue tint, and ZERO rainbow aberration.

// Generates a high-precision 288x192 3D Capsule Meniscus Displacement Map DataURL
// for SVG <feDisplacementMap> so icons and labels physically warp and rise up
// along the curved 3D glass walls just like Apple iOS 26 Liquid Glass.
let cachedMeniscusMapUrl = null;
export function getCapsuleMeniscusMapDataURL() {
  if (cachedMeniscusMapUrl) return cachedMeniscusMapUrl;
  if (typeof document === 'undefined') return '';

  const W = 288;
  const H = 192;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;
  const aspect = W / H; // 72 / 48 = 1.5
  const rPill = 1.0;
  const bX = aspect - rPill; // 0.5

  for (let py = 0; py < H; py++) {
    const nyNorm = ((py + 0.5) / H) * 2.0 - 1.0; // -1 .. 1
    for (let px = 0; px < W; px++) {
      const nxNorm = ((px + 0.5) / W) * 2.0 - 1.0; // -1 .. 1
      const x = nxNorm * aspect; // -1.5 .. 1.5
      const y = nyNorm; // -1.0 .. 1.0

      // Distance from the capsule spine [-bX, +bX]
      const absX = Math.abs(x);
      const dx = Math.max(absX - bX, 0.0) * (x < 0 ? -1 : 1);
      const dy = y;
      const rho = Math.sqrt(dx * dx + dy * dy);

      let dispX = 0;
      let dispY = 0;

      if (rho > 0.0001) {
        const ux = dx / rho;
        const uy = dy / rho;

        // 1. Paraxial Convex Dome Lift ( gently pulls content forward in 3D )
        const domeR = Math.min(1.0, rho);
        const domeFactor = domeR * 0.14;

        // 2. Steep 3D Meniscus Bevel Refraction (rho in 0.30 .. 1.0)
        // Bends rays inward so icons & text stretch and climb up the curved glass wall
        const tRim = Math.max(0.0, Math.min(1.0, (rho - 0.28) / 0.72));
        const smoothT = tRim * tRim * (3.0 - 2.0 * tRim);
        const meniscusPull = smoothT * tRim * 0.86;

        const totalPull = domeFactor + meniscusPull;
        const dirX = ux * 0.78 + nxNorm * 0.22;
        const dirY = uy * 0.78 + nyNorm * 0.22;

        // Negative displacement fetches inward pixels -> stretches image outward to the rim!
        dispX = -dirX * totalPull;
        dispY = -dirY * totalPull;
      }

      const idx = (py * W + px) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(128 + dispX * 124))); // R = X displacement
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + dispY * 124))); // G = Y displacement
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  cachedMeniscusMapUrl = canvas.toDataURL('image/png');
  return cachedMeniscusMapUrl;
}

const VERTEX_SHADER_GLSL = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_GLSL = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_bubblePos;
uniform vec2 u_bubbleHalfSize;
uniform float u_glassActive;
uniform float u_glassLift;
uniform float u_tiltX;
uniform float u_weber;
uniform float u_shear;

// Schlick's Fresnel Approximation: R(theta) = F0 + (1 - F0) * (1 - cos(theta))^5
// For Crown Crystal Glass (n = 1.52), F0 = ((1.0 - 1.52) / (1.0 + 1.52))^2 = 0.0426
float fresnelSchlick(float cosTheta, float F0) {
  float c = clamp(1.0 - cosTheta, 0.0, 1.0);
  float c2 = c * c;
  return F0 + (1.0 - F0) * (c2 * c2 * c);
}

// Exact 2D Capsule Signed Distance Field (SDF)
float capsuleSDF(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b;
  return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
}

void main() {
  // Convert UV to top-left origin pixel coordinates matching DOM layout
  vec2 fragPx = vec2(v_uv.x * u_resolution.x, (1.0 - v_uv.y) * u_resolution.y);

  // 1. Container Capsule Host Dock SDF (Full menu bar container)
  vec2 barCenter = u_resolution * 0.5;
  float barR = barCenter.y - 0.5;
  float barHalfW = max(0.0, barCenter.x - barR - 0.5);
  float distBar = capsuleSDF(fragPx - barCenter, vec2(barHalfW, 0.0), barR);

  // Outside the container capsule entirely: discard cleanly
  if (distBar > 1.2) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Container Capsule Bevel & Top/Bottom Specular Highlights
  float barEdgeAA = 1.0 - smoothstep(0.0, 1.2, distBar);
  // Crisp top specular lip along the entire container bar (0.9px to 1.8px)
  float barTopLip = (1.0 - smoothstep(0.0, 1.8, fragPx.y - 0.5)) * 0.40;
  // Dynamic traveling condensation caustics on the container bar, focused right above the bubble
  float distToBubbleX = abs(fragPx.x - u_bubblePos.x);
  float causticTrack = exp(-pow(distToBubbleX / 44.0, 2.0));
  float barCausticGleam = barTopLip * (0.80 + causticTrack * 1.20);
  // Subtle warm bottom bounce highlight on container
  float barBottomGleam = (1.0 - smoothstep(0.0, 1.5, u_resolution.y - 0.5 - fragPx.y)) * 0.22;
  // Container perimeter crystal bevel
  float barBevel = (1.0 - smoothstep(0.0, 1.2, -distBar)) * 0.30;

  vec3 barCol = vec3(1.0, 0.994, 0.982);
  float barAlpha = clamp(barCausticGleam + barBottomGleam + barBevel, 0.0, 1.0) * barEdgeAA;

  // 2. 3D Liquid Bubble Droplet (72x48) — Hydrodynamic Weber Flow & Teardrop Asymmetry
  vec2 rel = fragPx - u_bubblePos;
  float normX = clamp(rel.x / max(1.0, u_bubbleHalfSize.x), -1.5, 1.5);
  // Leading edge swells slightly from stagnation pressure; trailing wake tapers
  float headBulge = 1.0 + clamp(u_tiltX * normX, -0.045, 0.055) * u_weber;
  vec2 q = vec2(rel.x - rel.y * u_shear, rel.y / headBulge);

  // Exact 2D Capsule SDF for Bubble Droplet
  float rPill = min(u_bubbleHalfSize.x, u_bubbleHalfSize.y);
  vec2 bPill = max(u_bubbleHalfSize - vec2(rPill), vec2(0.0));
  vec2 dVec = abs(q) - bPill;
  vec2 maxD = max(dVec, vec2(0.0));
  float dist = length(maxD) + min(max(dVec.x, dVec.y), 0.0) - rPill;

  // If far outside droplet, output container dock highlights
  if (dist > 14.0) {
    gl_FragColor = vec4(barCol * barAlpha, barAlpha);
    return;
  }

  // 3. Exterior Droplet Subsurface Caustic Glow (dist > 0.45)
  if (dist > 0.45) {
    vec2 causticRel = rel - vec2(-u_tiltX * 1.8, 1.5 + u_glassLift * 2.5);
    vec2 cAbs = abs(causticRel) - bPill;
    float cDist = length(max(cAbs, vec2(0.0))) + min(max(cAbs.x, cAbs.y), 0.0) - rPill;
    float causticAlpha = exp(-pow(max(0.0, cDist - 0.8) * 0.35, 2.0)) * (0.28 * u_glassLift) * smoothstep(14.0, 0.6, dist);
    vec3 causticCol = vec3(1.0, 0.992, 0.972);

    float combinedAlpha = clamp(barAlpha + causticAlpha, 0.0, 1.0);
    vec3 combinedCol = mix(barCol, causticCol, causticAlpha / max(0.001, combinedAlpha));
    gl_FragColor = vec4(combinedCol * combinedAlpha, combinedAlpha);
    return;
  }

  // 4. Analytical Outward 2D Unit Normal of the Capsule SDF
  vec2 grad2D;
  if (dVec.x > 0.0 && dVec.y > 0.0) {
    grad2D = normalize(maxD) * sign(q);
  } else if (dVec.x > dVec.y) {
    grad2D = vec2(sign(q.x), 0.0);
  } else {
    grad2D = vec2(0.0, sign(q.y));
  }

  // 5. 3D Convex Meniscus Heightfield z(x, y) & Analytic 3D Surface Normal N
  float edgeAA = 1.0 - smoothstep(-0.75, 0.45, dist);
  float rimWidth = 9.2 + u_glassLift * 3.5;
  float tRim = clamp(-dist / rimWidth, 0.0, 1.0);

  // Toroidal meniscus wall profile: z_rim = sqrt(1 - (1 - tRim)^2)
  float oneMinusT = 1.0 - tRim;
  float zRim = sqrt(max(0.004, 1.0 - oneMinusT * oneMinusT));
  float meniscusSlope = oneMinusT / max(0.20, zRim);

  // Paraxial dome curvature across interior of lens
  vec2 domeCoord = q / max(vec2(1.0), u_bubbleHalfSize);
  vec2 N_xy = grad2D * meniscusSlope * (0.68 + u_glassLift * 0.24) + domeCoord * (0.20 + u_glassActive * 0.10);
  N_xy.x -= u_tiltX * 0.22 * (0.4 + 0.6 * tRim);

  vec3 N = normalize(vec3(N_xy.x, N_xy.y, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);

  // 6. Hardware Snell's Law 3D Optical Refraction Ray: n1 * sin(theta1) = n2 * sin(theta2)
  vec3 I = vec3(0.0, 0.0, -1.0);
  vec3 R_refract = refract(I, N, 0.6579);
  float snellCaustic = clamp(length(R_refract.xy) * 1.55, 0.0, 1.0) * (1.0 - smoothstep(0.08, 0.62, tRim));

  // 7. Schlick's Fresnel Surface Reflectance
  float cosTheta = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = fresnelSchlick(cosTheta, 0.0426);

  // 8. Physically-Based (PBR) Multi-Light Crystal Specular Reflections (Pure Luminous White/Warm Ivory)
  vec3 L_key = normalize(vec3(-u_tiltX * 0.42, -0.74 - u_glassLift * 0.10, 0.66));
  vec3 H_key = normalize(L_key + V);
  float specKey = pow(max(0.0, dot(N, H_key)), 54.0) * (0.80 + u_glassLift * 0.22);
  float specCrown = pow(max(0.0, dot(N, H_key)), 14.0) * (0.18 + (1.0 - u_glassActive) * 0.12) * (1.0 - smoothstep(-0.85, 0.05, domeCoord.y));

  vec3 L_rim = normalize(vec3(u_tiltX * 0.28, 0.82, 0.54));
  vec3 H_rim = normalize(L_rim + V);
  float specRim = pow(max(0.0, dot(N, H_rim)), 34.0) * (0.48 + u_glassLift * 0.22);

  vec3 L_flow = normalize(vec3(sign(u_tiltX) * 0.84, -0.10, 0.52));
  vec3 H_flow = normalize(L_flow + V);
  float specFlow = pow(max(0.0, dot(N, H_flow)), 22.0) * abs(u_tiltX) * 0.54;

  float outerCrispRim = (1.0 - smoothstep(0.0, 1.75, -dist)) * (0.96 + u_glassLift * 0.04);
  float fresnelWall = smoothstep(0.48, 0.0, tRim) * fresnel * (1.6 + u_glassActive * 1.1);

  vec3 pureWhite = vec3(1.0, 1.0, 1.0);
  vec3 warmCrystal = vec3(1.0, 0.992, 0.976);

  float bubbleAlpha = clamp(
    outerCrispRim + specKey + specCrown + specRim * 0.82 + specFlow + fresnelWall + snellCaustic * 0.30,
    0.0,
    1.0
  ) * edgeAA;

  vec3 bubbleCol = mix(warmCrystal, pureWhite, clamp(outerCrispRim + specKey + specFlow + fresnelWall, 0.0, 1.0));

  // Seamless additive blend with premultiplied alpha
  float totalAlpha = clamp(barAlpha + bubbleAlpha, 0.0, 1.0);
  vec3 totalCol = mix(barCol, bubbleCol, bubbleAlpha / max(0.001, totalAlpha));

  gl_FragColor = vec4(totalCol * totalAlpha, totalAlpha);
}
`;

export class LiquidGlassWebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.isReady = false;
    this.lastRenderParams = null;
    this.init();
  }

  init() {
    if (!this.canvas) return;
    const gl =
      this.canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true }) ||
      this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;
    this.gl = gl;

    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_GLSL);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_GLSL);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }
    this.program = program;
    gl.useProgram(program);

    // Fullscreen Quad Geometry
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Cache Uniform Locations
    const uniformNames = [
      'u_resolution',
      'u_bubblePos',
      'u_bubbleHalfSize',
      'u_glassActive',
      'u_glassLift',
      'u_tiltX',
      'u_weber',
      'u_shear',
    ];
    uniformNames.forEach((name) => {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    });

    this.isReady = true;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  resize(cssWidth, cssHeight) {
    if (!this.gl || !this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    if (this.width === cssWidth && this.height === cssHeight && this.dpr === dpr) return;
    this.width = cssWidth;
    this.height = cssHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  updateSceneTexture() {
    if (this.lastRenderParams) {
      this.render(this.lastRenderParams);
    }
  }

  render(params) {
    if (!params) return false;
    this.lastRenderParams = params;
    const {
      width,
      height,
      pixelX,
      liftOffsetY,
      halfWidth = 36.0,
      halfHeight = 24.0,
      scaleX,
      scaleY,
      glassActive,
      glassLift,
      tiltX,
      weber,
      shearRad,
    } = params;
    const gl = this.gl;
    if (!gl || !this.program) return false;

    this.resize(width, height);
    gl.useProgram(this.program);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(this.uniforms.u_resolution, width, height);
    gl.uniform2f(this.uniforms.u_bubblePos, pixelX, height * 0.5 + liftOffsetY);
    gl.uniform2f(this.uniforms.u_bubbleHalfSize, halfWidth * scaleX, halfHeight * scaleY);
    gl.uniform1f(this.uniforms.u_glassActive, glassActive);
    gl.uniform1f(this.uniforms.u_glassLift, glassLift);
    gl.uniform1f(this.uniforms.u_tiltX, tiltX);
    gl.uniform1f(this.uniforms.u_weber, weber);
    gl.uniform1f(this.uniforms.u_shear, shearRad);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  destroy() {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
    this.isReady = false;
  }
}
