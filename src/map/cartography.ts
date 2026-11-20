import type { CustomLayerInterface, Map as LibreMap } from 'maplibre-gl';

export const mercatorY = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360)) / Math.PI) / 2;
export function waveHash(x: number, y: number, salt: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ salt;
  n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Mercator point sprites share the map's GPU camera. Land/shore layers mask them. */
export function oceanWaves(): CustomLayerInterface {
  let map: LibreMap, program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, vao: WebGLVertexArrayObject | null = null;
  let key = '', count = 0;
  const reset = () => { program = null; buffer = null; vao = null; key = ''; };
  return {
    id: 'ocean-waves', type: 'custom', renderingMode: '2d',
    onAdd(atlas) { map = atlas; map.on('webglcontextrestored', reset); },
    render(gl, input) {
      const zoom = map.getZoom(); if (zoom >= 7.75) return;
      if (!program) {
        const shader = (type: number, code: string) => {
          const result = gl.createShader(type)!; gl.shaderSource(result, code); gl.compileShader(result);
          if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) ?? 'Wave shader failed');
          return result;
        };
        const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
          precision highp float;
          in vec3 a_point; uniform mat4 u_matrix; uniform float u_zoom; uniform float u_ratio;
          out float v_alpha;
          void main() {
            gl_Position = u_matrix * vec4(a_point.xy, 0., 1.);
            gl_PointSize = 8. * u_ratio;
            v_alpha = .42 * smoothstep(a_point.z - 6., a_point.z - 5., u_zoom) * (1. - smoothstep(7., 7.75, u_zoom));
          }`);
        const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
          precision highp float;
          in float v_alpha; out vec4 color;
          void main() {
            vec2 p = floor(gl_PointCoord * 8.);
            bool middle = p.x >= 3. && p.x < 5.;
            if ((middle && p.y != 3.) || (!middle && p.y != 4.)) discard;
            color = vec4(vec3(72.,104.,116.) / 255. * v_alpha, v_alpha);
          }`);
        program = gl.createProgram()!; gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        gl.deleteShader(vertex); gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Wave program failed');
        buffer = gl.createBuffer(); vao = gl.createVertexArray();
      }
      const size = map.getContainer(), scale = 512 * 2 ** zoom, center = map.getCenter();
      const cx = (center.lng + 180) / 360, cy = mercatorY(center.lat);
      const left = cx - (size.clientWidth / 2 + 96) / scale, right = cx + (size.clientWidth / 2 + 96) / scale;
      const top = cy - (size.clientHeight / 2 + 96) / scale, bottom = cy + (size.clientHeight / 2 + 96) / scale;
      const level = Math.floor(zoom + 6) + 1, cells = 2 ** level;
      const nextKey = `${level}:${Math.floor(left * cells)}:${Math.ceil(right * cells)}:${Math.floor(top * cells)}:${Math.ceil(bottom * cells)}`;
      gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      if (nextKey !== key) {
        const points: number[] = [];
        for (let lod = 1; lod <= level; lod++) {
          const n = 2 ** lod;
          for (let y = Math.max(0, Math.floor(top * n)); y <= Math.min(n - 1, Math.ceil(bottom * n)); y++) for (let x = Math.floor(left * n); x <= Math.ceil(right * n); x++) {
            const wx = ((x % n) + n) % n;
            if (waveHash(wx, y, lod * 89) < .55) continue;
            points.push((x + .15 + waveHash(wx, y, 17) * .7) / n, (y + .15 + waveHash(wx, y, 53) * .7) / n, lod);
          }
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW); count = points.length / 3; key = nextKey;
      }
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'a_point'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, input.defaultProjectionData.mainMatrix);
      gl.uniform1f(gl.getUniformLocation(program, 'u_zoom'), zoom);
      gl.uniform1f(gl.getUniformLocation(program, 'u_ratio'), map.getCanvas().width / Math.max(1, size.clientWidth));
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.STENCIL_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, count); gl.bindVertexArray(null);
    },
    onRemove(_map, gl) { map.off('webglcontextrestored', reset); if (program) gl.deleteProgram(program); if (buffer) gl.deleteBuffer(buffer); if (vao) gl.deleteVertexArray(vao); },
  };
}
