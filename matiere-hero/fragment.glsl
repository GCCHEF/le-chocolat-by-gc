precision highp float;

uniform vec3 uCameraPosition;
uniform vec3 uKeyLight;
uniform vec3 uRimLight;
uniform vec3 uMouseLight;
uniform float uTime;

in vec3 vWorldPosition;
in vec3 vViewPosition;
in vec3 vNormal;

out vec4 fragColor;

#include "./noise.glsl"

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 keyDir = normalize(uKeyLight - vWorldPosition);
  vec3 rimDir = normalize(uRimLight - vWorldPosition);
  vec3 mouseDir = normalize(uMouseLight - vWorldPosition);
  vec3 reflected = reflect(-viewDir, normal);

  float facing = max(dot(viewDir, normal), 0.0);
  float fresnel = pow(1.0 - facing, 2.85);
  float rim = pow(max(dot(normal, rimDir), 0.0), 1.65) * fresnel;
  float keyTight = pow(max(dot(normalize(keyDir + viewDir), normal), 0.0), 340.0);
  float keySoft = pow(max(dot(reflect(-keyDir, normal), viewDir), 0.0), 68.0);
  float whiteTight = pow(max(dot(normalize(rimDir + viewDir), normal), 0.0), 360.0);
  float mouseGlint = pow(max(dot(reflect(-mouseDir, normal), viewDir), 0.0), 96.0);

  // Slow reflection bands imply a dark studio around the object without adding visible scenery.
  float longStripA = smoothstep(0.972, 0.997, abs(reflected.x * 0.55 + reflected.y * 0.83));
  float longStripB = smoothstep(0.955, 0.993, abs(reflected.x * -0.72 + reflected.z * 0.58));
  float longStripC = smoothstep(0.962, 0.997, abs(reflected.y * 0.45 - reflected.z * 0.88));
  float reflectedBand =
    smoothstep(0.48, 0.998, reflected.y * 0.5 + 0.5) * 0.055 +
    smoothstep(0.84, 0.992, abs(reflected.x + sin(uTime * 0.025) * 0.035)) * 0.16 +
    smoothstep(0.9, 0.999, abs(reflected.z - 0.12)) * 0.07 +
    (longStripA + longStripB * 0.78 + longStripC * 0.55) * 0.3;

  float depthShade = smoothstep(-1.3, 0.85, vViewPosition.z);
  float internalDepth = fbm(reflected * 0.85 + vec3(uTime * 0.006, 0.4, -0.2)) * 0.006;

  vec3 onyxCore = vec3(0.0008, 0.0008, 0.0009);
  vec3 blackGlass = vec3(0.006, 0.0063, 0.007);
  vec3 studioWhite = vec3(0.98, 0.985, 0.975);
  vec3 coolEdge = vec3(0.36, 0.46, 0.56);
  vec3 innerDepth = vec3(0.032, 0.033, 0.034);

  vec3 color = mix(onyxCore, blackGlass, 0.3 + internalDepth);
  color *= mix(0.18, 0.62, depthShade);
  color += studioWhite * (reflectedBand * 0.32 + keySoft * 0.055 + keyTight * 1.35);
  color += coolEdge * (fresnel * 0.045);
  color += innerDepth * internalDepth * 0.12;
  color += studioWhite * (rim * 1.02 + whiteTight * 1.24 + mouseGlint * 0.025);

  color = pow(max(color, 0.0), vec3(1.04));
  fragColor = vec4(color, 1.0);
}
