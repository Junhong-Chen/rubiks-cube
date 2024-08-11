precision mediump float;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uResolution;
uniform float uProgress;
uniform vec3 uColors[6];
uniform bool uFall;

attribute vec3 position;
attribute float aTimeMultiplier;
attribute float aColorRandomness;
 attribute vec3 axis;

varying vec3 vColor;
varying mat3 vRotationMatrix;

// remap 函数接受四个参数：值，原始范围的最小值和最大值，目标范围的最小值和最大值
float remap(float value, float minOriginal, float maxOriginal, float minTarget, float maxTarget) {
  // 首先，将输入值在原始范围内进行标准化，即将其映射到 [0, 1] 的范围内
  float normalizedValue = (value - minOriginal) / (maxOriginal - minOriginal);
  // 接下来，将标准化后的值映射到目标范围内
  float remappedValue = minTarget + normalizedValue * (maxTarget - minTarget);
  // 返回映射后的值，并限定在目标值范围中
  float min = minTarget;
  float max = maxTarget;
  if (min > max) {
    float temp = min;
    min = max;
    max = temp;
  }
  return clamp(remappedValue, min, max);
}

 mat3 computeRotationMatrix(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
  );
}

void main() {
  vec3 _position = position;

  gl_PointSize = uSize * uPixelRatio * uResolution.y;

  
  if (uFall) {
    float progress = uProgress * aTimeMultiplier / 32.;

    // Falling
    _position.y -= mod(progress * 5., 5.);

    // Rotating
    float angle = progress * 3.141592653589793 * 32.0;
    vRotationMatrix = computeRotationMatrix(axis, angle);

    vec4 modelPosition = modelMatrix * vec4(_position, 1.);
    vec4 viewModelPosition = viewMatrix * modelPosition;
    gl_Position = vec4(_position, 1.);
    
    gl_PointSize *= 1. / - viewModelPosition.z;

  } else {

    float progress = uProgress * aTimeMultiplier;

    // Exploding
    float explodingProgress = remap(progress, .0, .1, 0., 1.);
    explodingProgress = 1. - pow(1. - explodingProgress, 3.);
    _position *= explodingProgress;

    // Hanging
    float hangingProgress = remap(progress, .1, .2, 0., 1.);
    hangingProgress = pow(hangingProgress, 1.5);
    _position.y -= hangingProgress * .5;

    // Falling
    float fallingProgress = remap(progress, .2, 1., 0., 1.);
    _position.y -= fallingProgress * 5.;

    // Rotating
    float angle = progress * 3.141592653589793 * 8.0;
    vRotationMatrix = computeRotationMatrix(axis, angle);

    // Fading
    float fadingProgres = remap(progress, .9, 1., 1., 0.);

    vec4 modelPosition = modelMatrix * vec4(_position, 1.);
    vec4 viewModelPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewModelPosition;

    gl_PointSize *= fadingProgres;
    gl_PointSize *= 1. / - viewModelPosition.z;
  }


  if (gl_PointSize < 1.)
    gl_Position = vec4(9999.9); // 当粒子大小小于 1 时，windowsOS 仍将其渲染为 1 个像素，故将其移出可视范围

  vColor = uColors[int(aColorRandomness)];
}