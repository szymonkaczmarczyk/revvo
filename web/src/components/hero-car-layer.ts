/**
 * Warstwa „auto przed napisem” (WebGL).
 *
 * Wideo jest „spakowane”: u góry pełna klatka 1920×1080, pod nią pasek z maską samego auta
 * (wycinek CROP klatki, maska z Apple Vision). Tło pokazuje górną część tego samego <video>,
 * a ten canvas rysuje nad tekstem wyłącznie piksele auta — z tego samego elementu wideo,
 * więc obie warstwy są zawsze zsynchronizowane. Na auto nakładamy te same przyciemnienia
 * (scrimy), co na tło, żeby nie odstawało jasnością.
 */

// Geometria w pikselach wideo 1080p (dla 720p wszystko ×2/3)
export const PACKED = { w: 1920, h: 1584, frameH: 1080 };
export const CROP = { x: 780, y: 420, w: 1002, h: 504 };

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;      // rozmiar canvasu (px urządzenia)
uniform vec3 uLayout;   // offsetX, offsetY, skala (px urządzenia na px wideo 1080p)
uniform vec4 uCrop;     // x, y, w, h wycinka z maską (px wideo 1080p)
uniform vec3 uPacked;   // szerokość, wysokość spakowanej klatki, wysokość części z obrazem (px 1080p)

vec4 over(vec4 dst, vec3 c, float a) { return vec4(dst.rgb * (1.0 - a) + c * a, 1.0); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 vp = (p - uLayout.xy) / uLayout.z;
  if (vp.x < uCrop.x || vp.y < uCrop.y || vp.x > uCrop.x + uCrop.z || vp.y > uCrop.y + uCrop.w) discard;

  vec3 col = texture2D(uTex, vp / uPacked.xy).rgb;
  vec2 mp = vec2(vp.x - uCrop.x, uPacked.z + (vp.y - uCrop.y));
  float m = texture2D(uTex, mp / uPacked.xy).r;
  // Maska: 1 = karoseria, ~0.4 = szyby (widać przez nie napis), 0 = tło
  float a = clamp((m - 0.03) / 0.94, 0.0, 1.0);
  if (a <= 0.0) discard;

  // Te same scrimy co w CSS (bg #14161B): pionowy (dół→góra) i poziomy (lewo→prawo)
  vec3 bg = vec3(20.0, 22.0, 27.0) / 255.0;
  float fromBottom = 1.0 - p.y / uRes.y;
  float a1 = fromBottom < 0.5 ? mix(1.0, 0.55, fromBottom / 0.5) : mix(0.55, 0.25, (fromBottom - 0.5) / 0.5);
  vec3 c1 = fromBottom < 0.5 ? bg : mix(bg, vec3(0.0), (fromBottom - 0.5) / 0.5);
  float fx = p.x / uRes.x;
  float a2 = fx < 0.5 ? mix(0.9, 0.4, fx / 0.5) : mix(0.4, 0.0, (fx - 0.5) / 0.5);

  vec4 outc = over(vec4(col, 1.0), c1, a1);
  outc = over(outc, bg, a2);
  gl_FragColor = vec4(outc.rgb * a, a);
}
`;

export type CarLayer = { draw: (layout: { x: number; y: number; scale: number }) => void; dispose: () => void };

export function createCarLayer(canvas: HTMLCanvasElement, video: HTMLVideoElement): CarLayer | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform4f(u("uCrop"), CROP.x, CROP.y, CROP.w, CROP.h);
  gl.uniform3f(u("uPacked"), PACKED.w, PACKED.h, PACKED.frameH);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    draw(layout) {
      if (video.readyState < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      // Współrzędne tekstury są znormalizowane, więc ta sama geometria 1080p działa też dla wariantu 720p
      gl.uniform2f(u("uRes"), w, h);
      gl.uniform3f(u("uLayout"), layout.x * dpr, layout.y * dpr, layout.scale * dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
