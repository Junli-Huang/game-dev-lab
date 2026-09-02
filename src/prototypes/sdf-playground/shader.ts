export const vertexShaderSource = `#version 300 es
in vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 uCirclePosition;
uniform vec2 uBoxPosition;
uniform float uCircleRadius;
uniform vec2 uBoxHalfSize;
uniform float uOutlineWidth;
uniform float uGlowWidth;
uniform float uEdgeSoftness;
uniform float uSmoothness;
uniform int uOperation;
uniform int uView;
out vec4 outColor;

float sdCircle(vec2 point, float radius) {
    return length(point) - radius;
}

float sdBox(vec2 point, vec2 halfSize) {
    vec2 offset = abs(point) - halfSize;
    float outsideDistance = length(max(offset, 0.0));
    float insideDistance = min(max(offset.x, offset.y), 0.0);
    return outsideDistance + insideDistance;
}

float opSmoothUnion(float distanceA, float distanceB, float smoothness) {
    float safeSmoothness = max(smoothness, 0.0001);
    float blend = clamp(0.5 + 0.5 * (distanceB - distanceA) / safeSmoothness, 0.0, 1.0);
    return mix(distanceB, distanceA, blend)
         - safeSmoothness * blend * (1.0 - blend);
}

float combineDistances(float distanceA, float distanceB) {
    if (uOperation == 0) return distanceA;
    if (uOperation == 1) return distanceB;
    // min is union because belonging to either shape gives a negative result.
    if (uOperation == 2) return min(distanceA, distanceB);
    // max is intersection because both distances must be negative.
    if (uOperation == 3) return max(distanceA, distanceB);
    if (uOperation == 4) return max(distanceA, -distanceB);
    return opSmoothUnion(distanceA, distanceB, uSmoothness);
}

void main() {
    // Dividing by resolution.y preserves aspect ratio and creates one
    // centered mathematical coordinate system independent of canvas pixels.
    vec2 point = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    float circleDistance = sdCircle(point - uCirclePosition, uCircleRadius);
    float boxDistance = sdBox(point - uBoxPosition, uBoxHalfSize);
    float distanceToBoundary = combineDistances(circleDistance, boxDistance);
    float antiAlias = max(uEdgeSoftness, 0.001);
    float boundary = 1.0 - smoothstep(0.0, antiAlias * 1.6, abs(distanceToBoundary));

    vec3 color;
    if (uView == 0) {
        // smoothstep turns signed distance into a soft analytic edge; no blur pass.
        float fill = 1.0 - smoothstep(-antiAlias, antiAlias, distanceToBoundary);
        float outline = 1.0 - smoothstep(uOutlineWidth, uOutlineWidth + antiAlias, abs(distanceToBoundary));
        float glow = exp(-abs(distanceToBoundary) / max(uGlowWidth, 0.001));
        color = mix(vec3(0.045, 0.075, 0.14), vec3(0.16, 0.76, 0.66), fill);
        color += vec3(1.0, 0.58, 0.25) * outline * 0.85;
        color += vec3(0.25, 0.55, 1.0) * glow * 0.42;
    } else if (uView == 1) {
        float fade = exp(-abs(distanceToBoundary) * 3.2);
        float bands = 0.5 + 0.5 * cos(distanceToBoundary * 55.0);
        vec3 signColor = distanceToBoundary < 0.0
            ? vec3(0.30, 0.16, 0.48)
            : vec3(0.08, 0.35, 0.43);
        color = signColor * (0.35 + fade * 0.55) + bands * 0.10;
        color = mix(color, vec3(1.0), boundary);
    } else if (uView == 2) {
        color = distanceToBoundary < 0.0
            ? vec3(0.12, 0.17, 0.30)
            : vec3(0.68, 0.75, 0.82);
        color = mix(color, vec3(1.0, 0.75, 0.25), boundary);
    } else {
        float contour = 1.0 - smoothstep(0.38, 0.5, abs(sin(distanceToBoundary * 55.0)));
        color = vec3(0.045, 0.075, 0.14) + contour * vec3(0.30, 0.72, 0.82);
        color = mix(color, vec3(1.0, 0.68, 0.25), boundary);
    }
    outColor = vec4(color, 1.0);
}`;

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown GLSL compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}
