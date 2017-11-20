export const uniform = `
uniform float uSaturation;
`
export const glsl = `
vec3 changeSaturation(vec3 color, float saturation) {
  float luma = dot(vec3(0.2125, 0.7154, 0.0721) * color, vec3(1.));
  return mix(vec3(luma), color, saturation);
 }
`
