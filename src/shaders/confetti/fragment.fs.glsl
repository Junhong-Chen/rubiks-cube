precision mediump float;

varying mat3 vRotationMatrix;
varying vec3 vColor;

void main() {
  // Rotating
  vec2 uv = gl_PointCoord - 0.5;
  vec3 rotatedUV = vRotationMatrix * vec3(uv, 0.0);

  float alpha = 1.0 - smoothstep(0.3, 0.4, length(rotatedUV.xy));
  gl_FragColor = vec4(vColor, alpha);

  // three.js fragment file
  // #include <tonemapping_fragment>
  // #include <colorspace_fragment>
}