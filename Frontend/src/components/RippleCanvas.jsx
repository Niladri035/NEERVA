import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function RippleCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Basic setup
    const container = containerRef.current;
    const scene = new THREE.Scene();
    
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0, 0) },
      u_ripples: { value: [] },
    };

    // Initialize ripples array
    for (let i = 0; i < 10; i++) {
      uniforms.u_ripples.value.push(new THREE.Vector3(-1, -1, 0)); // x, y, time
    }

    // Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_ripples[10];

        varying vec2 vUv;

        // Simplistic noise function
        float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
        float noise(vec2 x) {
          vec2 i = floor(x);
          vec2 f = fract(x);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 uv = vUv;
          vec2 st = vUv; // Fixed: Use vUv instead of gl_FragCoord to ignore devicePixelRatio
          
          float totalDistortion = 0.0;
          float rippleIntensity = 0.0;
          
          // Calculate ripples
          for(int i = 0; i < 10; i++) {
            if(u_ripples[i].z > 0.0) {
               vec2 center = u_ripples[i].xy / u_resolution.xy;
               // Adjust for aspect ratio
               center.y = 1.0 - center.y; 
               float aspect = u_resolution.x / u_resolution.y;
               vec2 p = st - center;
               p.x *= aspect;
               
               float dist = length(p);
               float age = u_time - u_ripples[i].z;
               float size = age * 0.5; // expansion speed
               
               if(dist < size && dist > size - 0.25 && age < 3.0) {
                 float wave = sin((dist - size) * 30.0) * exp(-age * 1.5);
                 totalDistortion += wave * 0.02;
                 rippleIntensity += abs(wave * 0.05); // Visual highlight for the ripple
               }
            }
          }

          // Flow field distortion (Perlin-like noise)
          float n = noise(uv * 3.0 + u_time * 0.15) * 0.02;
          uv += totalDistortion + n;

          // Soft ocean gradient based on modified UV
          vec3 color1 = vec3(0.95, 0.98, 0.99); // very light cyan
          vec3 color2 = vec3(0.80, 0.93, 0.93); // soft teal
          
          float mixVal = smoothstep(0.0, 1.0, uv.y + n * 2.0);
          vec3 finalColor = mix(color1, color2, mixVal);
          
          // Add specular highlight where ripples are
          finalColor += vec3(1.0) * rippleIntensity;

          gl_FragColor = vec4(finalColor, 0.5 + (totalDistortion * 2.0) + rippleIntensity);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking for ripples
    let currentRipple = 0;
    let lastMouseTime = 0;
    const onMouseMove = (e) => {
      uniforms.u_mouse.value.set(e.clientX, e.clientY);
      
      const now = clock.getElapsedTime();
      // Rate limit ripple creation (spawn roughly every 0.05 seconds of continuous movement)
      if (now - lastMouseTime > 0.05) {
        uniforms.u_ripples.value[currentRipple].set(e.clientX, e.clientY, uniforms.u_time.value);
        currentRipple = (currentRipple + 1) % 10;
        lastMouseTime = now;
      }
    };

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resize);

    // Animation Loop
    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
