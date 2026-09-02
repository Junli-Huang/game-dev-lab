import { compileShader, fragmentShaderSource, vertexShaderSource } from "./shader";
import type { ApplicationMode, SdfOperation, SdfState, SdfView } from "./state";

const operationIndex: Record<SdfOperation, number> = {
  circle: 0, box: 1, union: 2, intersection: 3, subtract: 4, "smooth-union": 5,
};
const viewIndex: Record<SdfView, number> = { normal: 0, distance: 1, sign: 2, contour: 3 };
const applicationIndex: Record<ApplicationMode, number> = {
  playground: 0, "ui-outline": 1, "spell-area": 2, metaball: 3, collision: 4,
};

export class SdfRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation>;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: false });
    if (!gl) throw new Error("WebGL2 is not supported by this browser.");
    this.gl = gl;
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    if (!program) throw new Error("Could not create WebGL program.");
    gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader); gl.linkProgram(program);
    gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "GLSL link failed.");
    this.program = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = {};
    for (const name of ["uResolution", "uCirclePosition", "uBoxPosition", "uPlayerPosition", "uCircleRadius", "uBoxHalfSize", "uOutlineWidth", "uGlowWidth", "uEdgeSoftness", "uSmoothness", "uOperation", "uView", "uApplication"]) {
      const location = gl.getUniformLocation(program, name);
      if (!location) throw new Error(`Missing shader uniform: ${name}`);
      this.uniforms[name] = location;
    }
  }

  render(state: SdfState) {
    const gl = this.gl; const u = this.uniforms;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.useProgram(this.program);
    gl.uniform2f(u.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uCirclePosition, state.circlePosition.x, state.circlePosition.y);
    gl.uniform2f(u.uBoxPosition, state.boxPosition.x, state.boxPosition.y);
    gl.uniform2f(u.uPlayerPosition, state.playerPosition.x, state.playerPosition.y);
    gl.uniform1f(u.uCircleRadius, state.circleRadius);
    gl.uniform2f(u.uBoxHalfSize, state.boxHalfWidth, state.boxHalfHeight);
    gl.uniform1f(u.uOutlineWidth, state.outlineWidth);
    gl.uniform1f(u.uGlowWidth, state.glowWidth);
    gl.uniform1f(u.uEdgeSoftness, state.edgeSoftness);
    gl.uniform1f(u.uSmoothness, state.smoothness);
    gl.uniform1i(u.uOperation, operationIndex[state.operation]);
    gl.uniform1i(u.uView, viewIndex[state.view]);
    gl.uniform1i(u.uApplication, applicationIndex[state.application]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
