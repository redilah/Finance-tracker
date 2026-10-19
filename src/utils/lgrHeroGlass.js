/**
 * ============================================================================
 * LIQUID GLASS REDI (LGR v1.2) — HIGH-CONTRAST BIPHASIC & WATER-RIPPLE ENGINE
 * ============================================================================
 * Calibrated specifically for Cassiel Warm Cream (#F5EBE1) & Universal Backgrounds:
 *   1. Biphasic Dipole Contrast (Pure #FFFFFF Specular Crest + Deep Warm
 *      Champagne-Amber Beer-Lambert Trough) so glass & water ripples pop
 *      vividly on bright cream backgrounds without washing out.
 *   2. Standing Capillary Wave Field + Interactive Propagating Water Ripples
 *      so the "Apple Water-Ripple Glass" texture is always visible (both at
 *      rest and during touch/drag).
 *   3. 3D Liquid Glass Capsule Droplet over the 3 Account Stat Columns
 *      (Bank Accounts | E-Wallet | Credit Card) with RK4 hydro-springs and
 *      Navier-Stokes Weber volume conservation.
 */

class RK4Spring {
  constructor(initialValue = 0, stiffnessK = 304.6, dampingC = 28.5) {
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.acceleration = 0;
    this.k = stiffnessK;
    this.c = dampingC;
  }

  setTarget(target) {
    this.target = target;
  }

  impulse(dv) {
    this.velocity += dv;
  }

  snap(val) {
    this.value = val;
    this.target = val;
    this.velocity = 0;
    this.acceleration = 0;
  }

  accel(x, v) {
    return -this.k * (x - this.target) - this.c * v;
  }

  step(dt) {
    const x0 = this.value;
    const v0 = this.velocity;

    const a1 = this.accel(x0, v0);
    const v1 = v0;

    const x2 = x0 + 0.5 * dt * v1;
    const v2 = v0 + 0.5 * dt * a1;
    const a2 = this.accel(x2, v2);

    const x3 = x0 + 0.5 * dt * v2;
    const v3 = v0 + 0.5 * dt * a2;
    const a3 = this.accel(x3, v3);

    const x4 = x0 + dt * v3;
    const v4 = v0 + dt * a3;
    const a4 = this.accel(x4, v4);

    this.value = x0 + (dt / 6.0) * (v1 + 2.0 * v2 + 2.0 * v3 + v4);
    this.velocity = v0 + (dt / 6.0) * (a1 + 2.0 * a2 + 2.0 * a3 + a4);
    this.acceleration = a4;

    if (
      Math.abs(this.value - this.target) < 0.0004 &&
      Math.abs(this.velocity) < 0.004
    ) {
      this.value = this.target;
      this.velocity = 0;
      this.acceleration = 0;
      return true;
    }
    return false;
  }
}

const LGR_HERO_VS = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const LGR_HERO_FS = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_pointerPos;
uniform vec2 u_lensHalfSize;
uniform vec2 u_tiltXY;
uniform float u_glassLift;
uniform float u_weber;
uniform float u_shear;
uniform float u_time;
uniform vec3 u_bgColor;
uniform vec3 u_lightPos;
uniform vec2 u_gyroTilt;
uniform vec4 u_ripples[6];

// Compile-Time Baked LGR CrownCrystalRedi Constants & Snellius Deflection
const float LGR_ETA_RED    = 0.660015;
const float LGR_ETA_GREEN  = 0.657895;
const float LGR_ETA_BLUE   = 0.654241;
const float LGR_FRESNEL_F0 = 0.042580;
const float LGR_OPTICAL_DEPTH = 14.5;
const vec3  LGR_SNELL_KAPPA_RGB = vec3(-0.339985, -0.342105, -0.345759);

float fresnelSchlick(float cosTheta, float F0) {
  float c = clamp(1.0 - cosTheta, 0.0, 1.0);
  float c2 = c * c;
  return F0 + (1.0 - F0) * (c2 * c2 * c);
}

float roundBoxSDF(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// Evaluates both Standing Hydro-Ripples & Propagating Touch Capillary Waves
// Returns vec3(height, dz/dx, dz/dy)
vec3 evaluateWaterRippleField(vec2 p, vec2 pillCenter, vec2 pillHalfSize, vec2 res) {
  float totalH = 0.0;
  vec2 totalGrad = vec2(0.0);

  // A. Sculpted Standing Capillary Water Rings around the Active Liquid Pill & Wallet Corner
  float rPill = min(pillHalfSize.x, pillHalfSize.y);
  float dPill = roundBoxSDF(p - pillCenter, pillHalfSize, rPill);
  if (dPill > -6.0 && dPill < 95.0) {
    float kStand = 0.28; // ~22px ring spacing
    float envStand = exp(-max(0.0, dPill) * 0.028) * smoothstep(-6.0, 4.0, dPill) * 0.52;
    float phaseStand = dPill * kStand - 0.8;
    vec2 dirPill = normalize((p - pillCenter) + vec2(1e-4));
    totalH += sin(phaseStand) * envStand;
    totalGrad += dirPill * (cos(phaseStand) * kStand * envStand);
  }

  // Subtle standing water-ripple concentric arcs radiating from top-right Wallet emblem
  vec2 walletOrigin = vec2(res.x - 45.0, 46.0);
  vec2 dWalletVec = p - walletOrigin;
  float dWallet = length(dWalletVec) + 1e-4;
  if (dWallet > 18.0 && dWallet < 165.0) {
    float kW = 0.24;
    float envW = exp(-max(0.0, dWallet - 26.0) * 0.022) * smoothstep(18.0, 32.0, dWallet) * 0.46;
    float phaseW = (dWallet - 26.0) * kW;
    vec2 dirW = dWalletVec / dWallet;
    totalH += sin(phaseW) * envW;
    totalGrad += dirW * (cos(phaseW) * kW * envW);
  }

  // B. Dynamic Propagating Capillary Ripples from User Touch / Drag
  for (int i = 0; i < 6; i++) {
    vec4 rip = u_ripples[i];
    float age = rip.z;
    float amp = rip.w;
    if (amp <= 0.001 || age <= 0.0 || age > 2.6) continue;

    vec2 delta = p - rip.xy;
    float dist = length(delta) + 1e-4;
    vec2 dir = delta / dist;

    float waveFront = age * 185.0;
    float radialRel = dist - waveFront;
    float packetEnv = exp(-(radialRel * radialRel) / (2.0 * 36.0 * 36.0));
    float timeDecay = pow(clamp(1.0 - age / 2.5, 0.0, 1.0), 1.5);
    float spatialDecay = 1.0 / (1.0 + dist * 0.004);

    float kDyn = 0.23;
    float phase = radialRel * kDyn - age * 5.0;
    float env = amp * packetEnv * timeDecay * spatialDecay;

    totalH += sin(phase) * env;
    totalGrad += dir * (cos(phase) * kDyn * env);
  }

  return vec3(totalH, totalGrad.x, totalGrad.y);
}

void main() {
  vec2 fragPx = vec2(v_uv.x * u_resolution.x, (1.0 - v_uv.y) * u_resolution.y);
  vec2 cardCenter = u_resolution * 0.5;
  float cornerR = 18.0;
  vec2 cardHalfSize = cardCenter - vec2(0.5);

  // -------------------------------------------------------------------------
  // 0. UNIVERSAL ADAPTIVE BACKGROUND LUMINANCE & BEER-LAMBERT TROUGH COLOR
  // -------------------------------------------------------------------------
  float Y_bg = dot(u_bgColor, vec3(0.2126, 0.7152, 0.0722));
  // High biphasic contrast polarity on bright backgrounds (like Cassiel Warm Cream Y_bg ~ 0.92)
  float troughPolarity = clamp(0.22 + 0.88 * pow(Y_bg, 1.25), 0.22, 1.0);

  // Rich Beer-Lambert Warm Amber-Champagne Refractive Trough Color:
  // Deepens cream into translucent golden-caramel glass shadow so white specular crests pop!
  vec3 beerLambertTint = vec3(0.66, 0.46, 0.27);
  vec3 troughGlassColor = mix(
    vec3(0.08, 0.06, 0.04),
    pow(clamp(u_bgColor, 0.08, 1.0), vec3(1.55)) * beerLambertTint,
    smoothstep(0.15, 0.60, Y_bg)
  );

  vec3 prismCoolTint = vec3(0.20, 0.64, 0.98); // Crystal Azure
  vec3 prismWarmTint = vec3(0.98, 0.58, 0.10); // Warm Amber Gold

  // -------------------------------------------------------------------------
  // 1. HOST HERO CARD 3D ROUNDED CRYSTAL SLAB & 4-ZONE BIPHASIC MENISCUS
  // -------------------------------------------------------------------------
  float distCard = roundBoxSDF(fragPx - cardCenter, cardHalfSize, cornerR);
  if (distCard > 1.2) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float cardEdgeAA = 1.0 - smoothstep(-0.5, 1.0, distCard);
  vec2 pRel = fragPx - cardCenter;
  vec2 qBox = abs(pRel) - cardHalfSize + vec2(cornerR);
  vec2 cardGrad2D = (qBox.x > 0.0 && qBox.y > 0.0)
    ? normalize(max(qBox, vec2(0.0))) * sign(pRel)
    : (qBox.x > qBox.y ? vec2(sign(pRel.x), 0.0) : vec2(0.0, sign(pRel.y)));

  // Evaluate Standing + Dynamic Water Ripples
  vec3 rippleField = evaluateWaterRippleField(fragPx, u_pointerPos, u_lensHalfSize, u_resolution);
  float rippleH = rippleField.x;
  vec2 rippleGrad = rippleField.yz;

  float cardRimW = 19.0 + u_glassLift * 3.5;
  float tCardRim = clamp(-distCard / cardRimW, 0.0, 1.0);
  float oneMinusCardT = 1.0 - tCardRim;
  float zCardRim = sqrt(max(0.005, 1.0 - oneMinusCardT * oneMinusCardT));
  float cardSlope = oneMinusCardT / max(0.20, zCardRim);

  vec2 normCoord = pRel / max(vec2(1.0), cardHalfSize);
  vec2 N_cardXY = cardGrad2D * cardSlope * (0.88 + u_glassLift * 0.24)
                + normCoord * 0.16
                + rippleGrad * 2.15;
  N_cardXY -= (u_tiltXY + u_gyroTilt * 0.65) * 0.28 * (0.45 + 0.55 * tCardRim);
  vec3 N_card = normalize(vec3(N_cardXY, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 I = vec3(0.0, 0.0, -1.0);

  // 4-Zone Biphasic Meniscus Profile around the Hero Card Perimeter:
  // Zone 0: Crisp Outer Contact Edge (0..1.5px)
  float cardOuterContact = (1.0 - smoothstep(0.0, 1.5, -distCard)) * 0.45 * troughPolarity;
  // Zone 1: Pure White Specular Rim Crest (0.8..4.5px)
  float cardWhiteCrest = exp(-pow((-distCard - 2.1) / 2.1, 2.0)) * 0.98;
  // Zone 2: Deep Beer-Lambert Refractive Trough (4.2..12.5px) -> High-contrast 3D glass wall on cream!
  float cardRefractiveTrough = exp(-pow((-distCard - 7.5) / 4.2, 2.0)) * (0.42 + 0.12 * u_glassLift) * troughPolarity;
  // Zone 3: Inner Caustic Convergence Ring (12.0..18.5px)
  float cardInnerCaustic = exp(-pow((-distCard - 14.2) / 3.4, 2.0)) * 0.72;

  // Pilar 1: 3D Gyroscope & Accelerometer Light Direction Vector
  vec3 defaultLight = vec3(0.0, -0.72, 0.65);
  vec3 activeLight = length(u_lightPos) > 0.01 ? u_lightPos : defaultLight;
  vec3 L_key = normalize(vec3(
    activeLight.x - u_tiltXY.x * 0.52,
    activeLight.y - u_tiltXY.y * 0.38,
    max(0.28, activeLight.z)
  ));
  vec3 H_key = normalize(L_key + V);
  float specKey = pow(max(0.0, dot(N_card, H_key)), 44.0) * (0.85 + u_glassLift * 0.25);

  // Travelling Specular Caustic along Top & Bottom Crystal Lips (sweeps with pointer + Gyro tilt)
  float distToPtrX = abs(fragPx.x - u_pointerPos.x - u_gyroTilt.x * 58.0);
  float causticTrackX = exp(-pow(distToPtrX / 96.0, 2.0));
  float topLipMask = 1.0 - smoothstep(0.0, 3.0, fragPx.y - 0.8);
  float botLipMask = 1.0 - smoothstep(0.0, 2.6, u_resolution.y - 0.8 - fragPx.y);
  float topCrystalGleam = topLipMask * (0.85 + causticTrackX * 0.65);
  float botCrystalGleam = botLipMask * (0.55 + causticTrackX * 0.45);

  // -------------------------------------------------------------------------
  // 2. CAPILLARY WATER-RIPPLE DIPOLE RENDERING (HIGH-CONTRAST CREST + TROUGH)
  // -------------------------------------------------------------------------
  vec2 rippleLightDir = normalize(vec2(-0.65 + u_gyroTilt.x * 0.70, -0.75 + u_gyroTilt.y * 0.70));
  float rippleLightFocus = clamp(rippleH * 0.95 + dot(rippleGrad, rippleLightDir) * 2.8, -1.0, 1.0);
  float rippleCrestAlpha = clamp(rippleLightFocus, 0.0, 1.0) * 0.88;
  float rippleTroughAlpha = clamp(-rippleLightFocus, 0.0, 1.0) * 0.52 * troughPolarity;
  vec3 ripplePrismCol = mix(prismCoolTint, prismWarmTint, clamp(0.5 + rippleGrad.x * 3.2 + u_gyroTilt.x * 0.4, 0.0, 1.0));

  // -------------------------------------------------------------------------
  // 3. INTERACTIVE 3D LIQUID GLASS CAPSULE DROPLET (OVER STAT COLUMNS / TOUCH)
  // -------------------------------------------------------------------------
  vec2 relLens = fragPx - u_pointerPos;
  float normLensX = clamp(relLens.x / max(1.0, u_lensHalfSize.x), -1.5, 1.5);
  float headBulge = 1.0 + clamp(u_tiltXY.x * normLensX, -0.045, 0.055) * u_weber;
  vec2 qLens = vec2(relLens.x - relLens.y * u_shear, relLens.y / headBulge);
  float rLens = min(u_lensHalfSize.x, u_lensHalfSize.y);
  float distLens = roundBoxSDF(qLens, u_lensHalfSize, rLens);

  float lensWhiteAlpha = 0.0;
  float lensDarkAlpha = 0.0;
  vec3 lensPrismAdd = vec3(0.0);

  if (distLens < 22.0) {
    if (distLens > 0.0) {
      // Exterior 3D Drop Shadow & Focused Caustic Halo around the Liquid Pill (swept by Gyro tilt)
      vec2 gyroShadowShift = vec2(u_gyroTilt.x * 3.8, u_gyroTilt.y * 3.2);
      vec2 shadowRel = relLens - vec2(-u_tiltXY.x * 2.5, 3.4 + u_glassLift * 3.5) - gyroShadowShift;
      float sDist = roundBoxSDF(shadowRel, u_lensHalfSize, rLens);
      float pillDropShadow = exp(-max(0.0, sDist) * 0.24) * (0.36 + u_glassLift * 0.16) * troughPolarity * smoothstep(0.0, 1.8, distLens);
      lensDarkAlpha += pillDropShadow;

      // Bright Jacobian Caustic Ring just outside the pill rim
      float outerCaustic = exp(-pow(max(0.0, distLens - 1.5) * 0.42, 2.0)) * (0.62 + u_glassLift * 0.32 + length(u_gyroTilt) * 0.18);
      lensWhiteAlpha += outerCaustic;
    } else {
      // Inside the 3D Liquid Glass Capsule Droplet:
      float lensEdgeAA = 1.0 - smoothstep(-0.75, 0.45, distLens);
      float lensRimW = 11.5 + u_glassLift * 3.0;
      float tLens = clamp(-distLens / lensRimW, 0.0, 1.0);
      float oneMinusLensT = 1.0 - tLens;
      float zLens = sqrt(max(0.005, 1.0 - oneMinusLensT * oneMinusLensT));
      float slopeLens = oneMinusLensT / max(0.20, zLens);

      vec2 qBoxLens = abs(qLens) - u_lensHalfSize + vec2(rLens);
      vec2 gradLens = (qBoxLens.x > 0.0 && qBoxLens.y > 0.0)
        ? normalize(max(qBoxLens, vec2(0.0))) * sign(qLens)
        : (qBoxLens.x > qBoxLens.y ? vec2(sign(qLens.x), 0.0) : vec2(0.0, sign(qLens.y)));

      vec2 domeLens = qLens / max(vec2(1.0), u_lensHalfSize);
      vec3 N_lens = normalize(vec3(gradLens * slopeLens * 0.88 + domeLens * 0.24 + rippleGrad * 1.6 - (u_tiltXY + u_gyroTilt * 0.65) * 0.22, 1.0));

      // Biphasic 4-Zone Meniscus of the 3D Liquid Pill:
      // 1) Crisp outer boundary step (0..1.3px)
      float pillContactEdge = (1.0 - smoothstep(0.0, 1.3, -distLens)) * 0.50 * troughPolarity;
      // 2) Pure diamond white specular crest (0.6..3.6px)
      float pillWhiteRim = exp(-pow((-distLens - 1.8) / 1.7, 2.0)) * 0.99;
      // 3) Deep Beer-Lambert Champagne-Amber Meniscus Trough (3.4..9.5px)
      float pillMeniscusTrough = exp(-pow((-distLens - 5.8) / 3.0, 2.0)) * (0.48 + u_glassLift * 0.14) * troughPolarity;
      // 4) Inner Caustic Ring & Bright Convex Dome Center
      float pillInnerCaustic = exp(-pow((-distLens - 10.2) / 2.6, 2.0)) * 0.78;
      float pillCenterDomeGlow = smoothstep(0.0, 0.85, tLens) * 0.55;

      float specLensKey = pow(max(0.0, dot(N_lens, H_key)), 46.0) * (0.94 + u_glassLift * 0.22);
      float specLensCrown = pow(max(0.0, dot(N_lens, H_key)), 12.0) * 0.42 * (1.0 - smoothstep(-0.90, 0.15, domeLens.y));
      float lensFresnel = fresnelSchlick(clamp(dot(N_lens, V), 0.0, 1.0), LGR_FRESNEL_F0) * smoothstep(0.58, 0.0, tLens) * 2.4;

      vec3 R_lensR = refract(I, N_lens, LGR_ETA_RED);
      vec3 R_lensB = refract(I, N_lens, LGR_ETA_BLUE);
      // Pilar 2: Snellius gradient optical deflection Delta p = d_eff * ((1 - n)/n) * gradZ
      float effDepth = LGR_OPTICAL_DEPTH * (1.0 + u_glassLift * 0.55);
      vec2 gradZ_lens = -N_lens.xy / max(0.25, N_lens.z);
      float snellWarp = length(gradZ_lens) * (LGR_SNELL_KAPPA_RGB.x - LGR_SNELL_KAPPA_RGB.z) * 0.28;
      float dispMag = (length(R_lensB.xy - R_lensR.xy) + snellWarp) * 32.0 * (0.75 + u_weber + u_glassLift * 0.7 + length(u_gyroTilt) * 0.35);
      lensPrismAdd = mix(prismCoolTint, prismWarmTint, clamp(0.5 + N_lens.x * 1.4, 0.0, 1.0))
                   * clamp(dispMag, 0.0, 0.52) * (1.0 - tLens);

      lensWhiteAlpha += clamp(pillWhiteRim + pillInnerCaustic + pillCenterDomeGlow + specLensKey + specLensCrown + lensFresnel, 0.0, 0.98) * lensEdgeAA;
      lensDarkAlpha += clamp(pillContactEdge + pillMeniscusTrough, 0.0, 0.68) * lensEdgeAA;
    }
  }

  // -------------------------------------------------------------------------
  // 4. COMPOSITE BIPHASIC LIGHT CRESTS & BEER-LAMBERT REFRACTIVE TROUGHS
  // -------------------------------------------------------------------------
  float totalWhiteAlpha = clamp(
    cardWhiteCrest + cardInnerCaustic + topCrystalGleam + botCrystalGleam + specKey * 0.78 + rippleCrestAlpha + lensWhiteAlpha,
    0.0,
    0.98
  ) * cardEdgeAA;

  float totalDarkAlpha = clamp(
    cardOuterContact + cardRefractiveTrough + rippleTroughAlpha + lensDarkAlpha,
    0.0,
    0.74
  ) * cardEdgeAA;

  vec3 crestColor = clamp(vec3(1.0, 0.998, 0.994) + lensPrismAdd * 0.46 + ripplePrismCol * rippleCrestAlpha * 0.38, 0.0, 1.0);

  float combinedAlpha = clamp(totalDarkAlpha + totalWhiteAlpha * (1.0 - totalDarkAlpha * 0.30), 0.0, 0.98);
  float whiteWeight = totalWhiteAlpha / max(0.001, totalWhiteAlpha + totalDarkAlpha * (1.0 - totalWhiteAlpha * 0.65));
  vec3 finalColor = mix(troughGlassColor, crestColor, clamp(whiteWeight, 0.0, 1.0));

  gl_FragColor = vec4(finalColor * combinedAlpha, combinedAlpha);
}
`;

export class LGRHeroGlassRenderer {
  constructor(canvas, containerEl) {
    this.canvas = canvas;
    this.containerEl = containerEl;
    this.gl =
      canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      }) ||
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });

    this.rafId = null;
    this.lastTime = 0;
    this.startTime = performance.now();
    this.pointerHeld = false;
    this.activeStatIndex = 0;
    this.lastRippleSpawnPos = { x: -999, y: -999 };

    // Default Cassiel Warm Cream (#F5EBE1)
    this.bgColorRGB = [0.961, 0.922, 0.882];

    this.ripples = Array.from({ length: 6 }, () => ({
      x: 0,
      y: 0,
      age: 99.0,
      amp: 0.0,
    }));
    this.nextRippleIdx = 0;

    // RK4 Hydro-Elastic Springs
    this.springX = new RK4Spring(68, 304.6, 28.5);
    this.springY = new RK4Spring(136, 304.6, 28.5);
    this.springW = new RK4Spring(54, 320.0, 28.0);
    this.springH = new RK4Spring(23, 320.0, 28.0);
    this.springTiltX = new RK4Spring(0, 340, 24);
    this.springTiltY = new RK4Spring(0, 340, 24);
    this.springLift = new RK4Spring(0, 320, 26);
    this.springScaleX = new RK4Spring(1, 400, 22);
    this.springScaleY = new RK4Spring(1, 400, 22);

    // Pilar 1: 3D Gyroscope & Accelerometer RK4 Harmonic Filter Springs
    // (\omega_n = 18.5 rad/s -> k = 342.25, \zeta = 0.92 -> c = 34.04)
    this.springGyroX = new RK4Spring(0, 342.25, 34.04);
    this.springGyroY = new RK4Spring(0, 342.25, 34.04);
    this.gyroCalibrated = false;
    this.gyroBaselinePitch = 35.0;
    this.lastGyroTargetX = 0;
    this.lastGyroTargetY = 0;
    this.lightPosVec = [0.0, -0.72, 0.65];

    if (!this.gl) return;
    this.initGL();
    this.detectBackgroundLuminance();
    this.snapToStatColumn(0);

    const initTarget = this.getStatColumnTarget(0);
    this.spawnCapillaryRipple(initTarget.x, initTarget.y, 1.0);

    this.bindEvents();
    this.wakeUp();
  }

  detectBackgroundLuminance() {
    if (typeof window === 'undefined' || !this.containerEl) return;
    try {
      const parentBg = window.getComputedStyle(document.body).backgroundColor || '';
      const match = parentBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match && (Number(match[1]) > 0 || Number(match[2]) > 0 || Number(match[3]) > 0)) {
        this.bgColorRGB = [
          Number(match[1]) / 255,
          Number(match[2]) / 255,
          Number(match[3]) / 255,
        ];
      } else {
        this.bgColorRGB = [0.961, 0.922, 0.882];
      }
    } catch (_) {
      this.bgColorRGB = [0.961, 0.922, 0.882];
    }
  }

  triggerHapticPulse(pattern = [8]) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // non-blocking fallback for desktop or unsupported devices
    }
  }

  spawnCapillaryRipple(x, y, amplitude = 1.0) {
    const r = this.ripples[this.nextRippleIdx];
    r.x = x;
    r.y = y;
    r.age = 0.001;
    r.amp = amplitude;
    this.nextRippleIdx = (this.nextRippleIdx + 1) % this.ripples.length;
    this.lastRippleSpawnPos = { x, y };

    if (amplitude >= 1.0) {
      this.triggerHapticPulse([8]);
    }
  }

  initGL() {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, LGR_HERO_VS);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, LGR_HERO_FS);
    gl.compileShader(fs);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uLocs = {
      u_resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      u_pointerPos: gl.getUniformLocation(this.program, 'u_pointerPos'),
      u_lensHalfSize: gl.getUniformLocation(this.program, 'u_lensHalfSize'),
      u_tiltXY: gl.getUniformLocation(this.program, 'u_tiltXY'),
      u_glassLift: gl.getUniformLocation(this.program, 'u_glassLift'),
      u_weber: gl.getUniformLocation(this.program, 'u_weber'),
      u_shear: gl.getUniformLocation(this.program, 'u_shear'),
      u_time: gl.getUniformLocation(this.program, 'u_time'),
      u_bgColor: gl.getUniformLocation(this.program, 'u_bgColor'),
      u_lightPos: gl.getUniformLocation(this.program, 'u_lightPos'),
      u_gyroTilt: gl.getUniformLocation(this.program, 'u_gyroTilt'),
      u_ripples: gl.getUniformLocation(this.program, 'u_ripples[0]'),
    };
  }

  getStatColumnTarget(idx) {
    const el = this.containerEl;
    if (!el) return { x: 68, y: 136, hw: 56, hh: 23 };
    const cols = el.querySelectorAll('.account-dual-stat-col');
    const col = cols[idx];
    if (col) {
      const cardRect = el.getBoundingClientRect();
      const colRect = col.getBoundingClientRect();
      return {
        x: colRect.left - cardRect.left + colRect.width * 0.5,
        y: colRect.top - cardRect.top + colRect.height * 0.5,
        hw: Math.max(48, colRect.width * 0.5 + 4),
        hh: Math.max(22, colRect.height * 0.5 + 7),
      };
    }
    const w = el.clientWidth || 340;
    const h = el.clientHeight || 168;
    const colW = (w - 36) / 3;
    return {
      x: 18 + colW * (idx + 0.5),
      y: h - 32,
      hw: colW * 0.48,
      hh: 23,
    };
  }

  snapToStatColumn(idx) {
    this.activeStatIndex = idx;
    const t = this.getStatColumnTarget(idx);
    this.springX.snap(t.x);
    this.springY.snap(t.y);
    this.springW.snap(t.hw);
    this.springH.snap(t.hh);
  }

  glideToStatColumn(idx) {
    this.activeStatIndex = idx;
    const t = this.getStatColumnTarget(idx);
    this.springX.setTarget(t.x);
    this.springY.setTarget(t.y);
    this.springW.setTarget(t.hw);
    this.springH.setTarget(t.hh);
    this.springScaleX.impulse(0.42);
    this.springScaleY.impulse(-0.34);
    this.springLift.setTarget(1.0);
    this.spawnCapillaryRipple(t.x, t.y, 1.05);
    this.triggerHapticPulse([12, 18, 8]);
    this.wakeUp();
  }

  bindEvents() {
    const el = this.containerEl;
    if (!el) return;

    this._onPointerDown = (e) => {
      this.detectBackgroundLuminance();
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.pointerHeld = true;

      this.spawnCapillaryRipple(x, y, 1.15);

      if (y > rect.height * 0.55) {
        const colIdx = Math.max(0, Math.min(2, Math.floor((x / rect.width) * 3)));
        this.glideToStatColumn(colIdx);
      } else {
        this.springX.setTarget(x);
        this.springY.setTarget(y);
        this.springW.setTarget(74);
        this.springH.setTarget(33);
        this.springLift.setTarget(1.0);
        this.springScaleX.impulse(0.46);
        this.springScaleY.impulse(-0.36);
      }

      const nx = (x / Math.max(1, rect.width)) * 2 - 1;
      const ny = (y / Math.max(1, rect.height)) * 2 - 1;
      this.springTiltX.setTarget(nx * 0.90);
      this.springTiltY.setTarget(ny * 0.90);

      this.wakeUp();
    };

    this._onPointerMove = (e) => {
      if (!this.pointerHeld && e.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(24, Math.min(rect.width - 24, e.clientX - rect.left));
      const y = Math.max(20, Math.min(rect.height - 20, e.clientY - rect.top));

      if (this.pointerHeld) {
        this.springX.setTarget(x);
        this.springY.setTarget(y);

        const moveDist = Math.hypot(
          x - this.lastRippleSpawnPos.x,
          y - this.lastRippleSpawnPos.y
        );
        if (moveDist > 34) {
          this.spawnCapillaryRipple(x, y, 0.80);
        }
      }

      const nx = (x / Math.max(1, rect.width)) * 2 - 1;
      const ny = (y / Math.max(1, rect.height)) * 2 - 1;
      this.springTiltX.setTarget(nx * (this.pointerHeld ? 0.95 : 0.45));
      this.springTiltY.setTarget(ny * (this.pointerHeld ? 0.95 : 0.45));

      this.wakeUp();
    };

    this._onPointerUpOrLeave = (e) => {
      if (this.pointerHeld && e && this.containerEl) {
        const rect = this.containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const colIdx = Math.max(0, Math.min(2, Math.floor((x / rect.width) * 3)));
        this.activeStatIndex = colIdx;
        const t = this.getStatColumnTarget(colIdx);
        this.spawnCapillaryRipple(t.x, t.y, 0.75);
      }
      this.pointerHeld = false;
      const t = this.getStatColumnTarget(this.activeStatIndex);
      this.springX.setTarget(t.x);
      this.springY.setTarget(t.y);
      this.springW.setTarget(t.hw);
      this.springH.setTarget(t.hh);
      this.springLift.setTarget(0.0);
      this.springTiltX.setTarget(0.0);
      this.springTiltY.setTarget(0.0);
      this.wakeUp();
    };

    // Pilar 1: Passive Hardware Gyroscope & Accelerometer Orientation Listener
    this._onDeviceOrientation = (ev) => {
      if (ev.gamma === null && ev.beta === null) return;
      const rawGamma = Math.max(-45, Math.min(45, Number(ev.gamma) || 0));
      const rawBeta = Math.max(-20, Math.min(85, Number(ev.beta) || 35));
      if (!this.gyroCalibrated) {
        this.gyroBaselinePitch = rawBeta;
        this.gyroCalibrated = true;
      }
      const normX = Math.max(-1, Math.min(1, (rawGamma / 38.0) * 0.82));
      const normY = Math.max(-1, Math.min(1, ((rawBeta - this.gyroBaselinePitch) / 38.0) * 0.82));

      // Deadzone filter (0.015) so resting phone on table auto-sleeps with 0% CPU/GPU drain
      if (
        Math.abs(normX - this.lastGyroTargetX) > 0.015 ||
        Math.abs(normY - this.lastGyroTargetY) > 0.015
      ) {
        this.lastGyroTargetX = normX;
        this.lastGyroTargetY = normY;
        this.springGyroX.setTarget(normX);
        this.springGyroY.setTarget(normY);
        this.wakeUp();
      }
    };

    el.addEventListener('pointerdown', this._onPointerDown, { passive: true });
    el.addEventListener('pointermove', this._onPointerMove, { passive: true });
    el.addEventListener('pointerup', this._onPointerUpOrLeave, { passive: true });
    el.addEventListener('pointercancel', this._onPointerUpOrLeave, { passive: true });
    el.addEventListener('pointerleave', this._onPointerUpOrLeave, { passive: true });

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', this._onDeviceOrientation, { passive: true });
    }
  }

  wakeUp() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.033);
      this.lastTime = now;

      const settled = this.stepPhysics(dt);
      this.renderFrame(now);

      if (!settled || this.pointerHeld) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stepPhysics(dt) {
    const subSteps = 4;
    const subDt = dt / subSteps;
    let springsSettled = true;

    for (let i = 0; i < subSteps; i++) {
      const s1 = this.springX.step(subDt);
      const s2 = this.springY.step(subDt);
      const s3 = this.springW.step(subDt);
      const s4 = this.springH.step(subDt);
      const s5 = this.springTiltX.step(subDt);
      const s6 = this.springTiltY.step(subDt);
      const s7 = this.springLift.step(subDt);
      const s8 = this.springScaleX.step(subDt);
      const s9 = this.springScaleY.step(subDt);
      const s10 = this.springGyroX.step(subDt);
      const s11 = this.springGyroY.step(subDt);
      springsSettled = s1 && s2 && s3 && s4 && s5 && s6 && s7 && s8 && s9 && s10 && s11;
    }

    // Update 3D unit light vector from smoothed Gyroscope roll & pitch
    const gx = this.springGyroX.value;
    const gy = this.springGyroY.value;
    const rawLx = -gx * 0.62;
    const rawLy = -0.72 + gy * 0.48;
    const rawLz = 0.65;
    const invLen = 1.0 / Math.hypot(rawLx, rawLy, rawLz);
    this.lightPosVec[0] = rawLx * invLen;
    this.lightPosVec[1] = rawLy * invLen;
    this.lightPosVec[2] = rawLz * invLen;

    let anyRippleActive = false;
    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      if (r.amp > 0.001 && r.age < 2.6) {
        r.age += dt;
        if (r.age < 2.6) {
          anyRippleActive = true;
        } else {
          r.amp = 0.0;
        }
      }
    }

    if (this.containerEl) {
      const w = this.containerEl.clientWidth || 340;
      const pctX = Math.max(8, Math.min(92, (this.springX.value / w) * 100 + gx * 14.0));
      this.containerEl.style.setProperty('--lgr-ptr-x', `${pctX.toFixed(1)}%`);
      this.containerEl.style.setProperty('--lgr-lift', this.springLift.value.toFixed(3));
      this.containerEl.style.setProperty('--lgr-tilt-x', `${((this.springTiltX.value + gx * 0.7) * 1.6).toFixed(2)}deg`);
      this.containerEl.style.setProperty('--lgr-tilt-y', `${((-this.springTiltY.value - gy * 0.7) * 1.6).toFixed(2)}deg`);
    }

    return springsSettled && !anyRippleActive;
  }

  renderFrame(now = performance.now()) {
    const gl = this.gl;
    if (!gl || !this.containerEl) return;

    const width = this.containerEl.clientWidth || 340;
    const height = this.containerEl.clientHeight || 168;
    const dpr = Math.min(window.devicePixelRatio || 2, 2.25);

    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      gl.viewport(0, 0, targetW, targetH);
    }

    const vx = this.springX.velocity;
    const weber = Math.tanh(Math.abs(vx) / 1180.0);
    const stretchX = Math.sqrt(1.0 + 0.28 * weber);
    const compressY = 1.0 / Math.sqrt(1.0 + 0.14 * weber);
    const swell = 1.0 + this.springLift.value * 0.065;
    const finalSX = this.springScaleX.value * stretchX * swell;
    const finalSY = this.springScaleY.value * compressY * swell;
    const shearRad = (Math.max(-2.5, Math.min(2.5, this.springTiltX.value * 1.85)) * Math.PI) / 180.0;

    const flatRipples = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      const r = this.ripples[i];
      flatRipples[i * 4 + 0] = r.x;
      flatRipples[i * 4 + 1] = r.y;
      flatRipples[i * 4 + 2] = r.age;
      flatRipples[i * 4 + 3] = r.amp;
    }

    gl.useProgram(this.program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(this.uLocs.u_resolution, width, height);
    gl.uniform2f(this.uLocs.u_pointerPos, this.springX.value, this.springY.value);
    gl.uniform2f(this.uLocs.u_lensHalfSize, this.springW.value * finalSX, this.springH.value * finalSY);
    gl.uniform2f(this.uLocs.u_tiltXY, this.springTiltX.value, this.springTiltY.value);
    gl.uniform1f(this.uLocs.u_glassLift, this.springLift.value);
    gl.uniform1f(this.uLocs.u_weber, weber);
    gl.uniform1f(this.uLocs.u_shear, shearRad);
    gl.uniform1f(this.uLocs.u_time, (now - this.startTime) / 1000.0);
    gl.uniform3f(
      this.uLocs.u_bgColor,
      this.bgColorRGB[0],
      this.bgColorRGB[1],
      this.bgColorRGB[2]
    );
    gl.uniform3f(
      this.uLocs.u_lightPos,
      this.lightPosVec[0],
      this.lightPosVec[1],
      this.lightPosVec[2]
    );
    gl.uniform2f(
      this.uLocs.u_gyroTilt,
      this.springGyroX.value,
      this.springGyroY.value
    );
    gl.uniform4fv(this.uLocs.u_ripples, flatRipples);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    const el = this.containerEl;
    if (el) {
      el.removeEventListener('pointerdown', this._onPointerDown);
      el.removeEventListener('pointermove', this._onPointerMove);
      el.removeEventListener('pointerup', this._onPointerUpOrLeave);
      el.removeEventListener('pointercancel', this._onPointerUpOrLeave);
      el.removeEventListener('pointerleave', this._onPointerUpOrLeave);
    }
    if (typeof window !== 'undefined' && this._onDeviceOrientation) {
      window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
