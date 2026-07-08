uniform float uTime;
uniform float uTimeOffset;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSpeed;
uniform float uPhase;

varying vec2 vUv;

void main() {
	vUv = uv;

	vec3 pos = position;
	float t = (uTime + uTimeOffset) * uSpeed + uPhase;

	float primary = sin(pos.y * uFrequency + t);
	float cross = cos(pos.y * uFrequency * 1.63 + t * 1.37 + 1.4) * 0.55;
	float ripple = sin(vUv.x * uFrequency * 2.8 - t * 0.9 + uPhase * 0.5) * 0.4;
	float gust = sin(pos.y * uFrequency * 0.35 - t * 0.45 + uPhase) * 0.35;
	float flutter = cos(vUv.x * uFrequency * 4.2 + t * 1.8 - uPhase) * sin(pos.y * uFrequency * 0.8 + t) * 0.25;

	float displacement = (primary + cross + ripple + gust + flutter) * 0.45;
	pos.y += displacement * uAmplitude * vUv.x;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
