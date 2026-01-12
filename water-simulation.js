import * as THREE from 'three';

export class WaterSimulation {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.particleSystem = null;
        this.waterMesh = null;
        
        // Simulation parameters
        this.waterLevel = 0.5;
        this.waveSpeed = 1.0;
        this.viscosity = 0.1;
        this.gravity = 9.8;
        this.waterColor = new THREE.Color(0x4a90e2);
        
        // Grid for water surface
        this.gridSize = 64;
        this.gridSpacing = 0.5;
        
        this.init();
    }
    
    init() {
        this.createWaterMesh();
        this.createParticleSystem();
    }
    
    createWaterMesh() {
        const geometry = new THREE.PlaneGeometry(
            this.gridSize * this.gridSpacing,
            this.gridSize * this.gridSpacing,
            this.gridSize,
            this.gridSize
        );
        
        // Custom shader material for realistic water
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: this.waterColor },
                lightDirection: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
                cameraPosition: { value: new THREE.Vector3() },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Wave animation
                    float wave1 = sin(position.x * 0.5 + time * 2.0) * 0.1;
                    float wave2 = cos(position.z * 0.3 + time * 1.5) * 0.08;
                    float wave3 = sin((position.x + position.z) * 0.4 + time * 2.5) * 0.05;
                    
                    vec3 pos = position;
                    pos.y += wave1 + wave2 + wave3;
                    
                    // Calculate normal for lighting
                    float dx = cos(position.x * 0.5 + time * 2.0) * 0.05;
                    float dz = -sin(position.z * 0.3 + time * 1.5) * 0.04;
                    vNormal = normalize(vec3(-dx, 1.0, -dz));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform vec3 lightDirection;
                uniform vec3 cameraPosition;
                uniform float opacity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, normal), 2.0);
                    
                    // Lighting
                    float lightIntensity = max(dot(normal, lightDirection), 0.3);
                    
                    // Water color with depth
                    vec3 color = waterColor * lightIntensity;
                    color = mix(color, vec3(0.1, 0.2, 0.4), fresnel * 0.5);
                    
                    // Foam effect at edges
                    float foam = smoothstep(0.4, 0.6, vUv.x) * smoothstep(0.4, 0.6, vUv.y);
                    foam *= smoothstep(0.4, 0.6, 1.0 - vUv.x) * smoothstep(0.4, 0.6, 1.0 - vUv.y);
                    color = mix(color, vec3(1.0), foam * 0.3);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.waterMesh = new THREE.Mesh(geometry, material);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = this.waterLevel * 10 - 5;
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
    }
    
    createParticleSystem() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random starting positions
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = Math.random() * 5 + 5;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;
            
            // Initial velocities
            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = -Math.random() * 0.5;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            
            // Colors based on water color
            colors[i3] = this.waterColor.r;
            colors[i3 + 1] = this.waterColor.g;
            colors[i3 + 2] = this.waterColor.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.userData.velocities = velocities;
        this.scene.add(this.particleSystem);
    }
    
    update(delta) {
        // Update water mesh shader
        if (this.waterMesh && this.waterMesh.material.uniforms) {
            this.waterMesh.material.uniforms.time.value += delta * this.waveSpeed;
        }
        
        // Update particles
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const velocities = this.particleSystem.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Apply gravity
                velocities[i + 1] -= this.gravity * delta;
                
                // Apply viscosity
                velocities[i] *= (1 - this.viscosity * delta);
                velocities[i + 1] *= (1 - this.viscosity * delta);
                velocities[i + 2] *= (1 - this.viscosity * delta);
                
                // Update positions
                positions[i] += velocities[i] * delta;
                positions[i + 1] += velocities[i + 1] * delta;
                positions[i + 2] += velocities[i + 2] * delta;
                
                // Boundary collision (ground)
                const groundLevel = this.waterLevel * 10 - 5;
                if (positions[i + 1] < groundLevel) {
                    positions[i + 1] = groundLevel;
                    velocities[i + 1] *= -0.3; // Bounce with damping
                    velocities[i] *= 0.8;
                    velocities[i + 2] *= 0.8;
                }
                
                // Boundary collision (walls)
                const boundary = 10;
                if (Math.abs(positions[i]) > boundary) {
                    positions[i] = Math.sign(positions[i]) * boundary;
                    velocities[i] *= -0.5;
                }
                if (Math.abs(positions[i + 2]) > boundary) {
                    positions[i + 2] = Math.sign(positions[i + 2]) * boundary;
                    velocities[i + 2] *= -0.5;
                }
                
                // Reset if too far
                if (positions[i + 1] < -10) {
                    positions[i] = (Math.random() - 0.5) * 20;
                    positions[i + 1] = Math.random() * 5 + 10;
                    positions[i + 2] = (Math.random() - 0.5) * 20;
                    velocities[i] = (Math.random() - 0.5) * 0.5;
                    velocities[i + 1] = -Math.random() * 0.5;
                    velocities[i + 2] = (Math.random() - 0.5) * 0.5;
                }
            }
            
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    checkCollisionWithShapes(particlePos, shapes) {
        for (const shape of shapes) {
            const shapePos = shape.position;
            const shapeScale = shape.scale;
            
            // Simple bounding box collision
            if (shape.geometry.type === 'BoxGeometry') {
                const size = 1 * Math.max(shapeScale.x, shapeScale.y, shapeScale.z);
                const dist = particlePos.distanceTo(shapePos);
                if (dist < size) {
                    const normal = particlePos.clone().sub(shapePos).normalize();
                    return { collided: true, normal };
                }
            }
        }
        return { collided: false };
    }
    
    setWaterLevel(level) {
        this.waterLevel = level;
        if (this.waterMesh) {
            this.waterMesh.position.y = level * 10 - 5;
        }
    }
    
    setWaveSpeed(speed) {
        this.waveSpeed = speed;
    }
    
    setViscosity(viscosity) {
        this.viscosity = viscosity;
    }
    
    setGravity(gravity) {
        this.gravity = gravity;
    }
    
    setWaterColor(color) {
        this.waterColor = color;
        if (this.waterMesh && this.waterMesh.material.uniforms) {
            this.waterMesh.material.uniforms.waterColor.value = color;
        }
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            for (let i = 0; i < colors.length; i += 3) {
                colors[i] = color.r;
                colors[i + 1] = color.g;
                colors[i + 2] = color.b;
            }
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    }
    
    reset() {
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const velocities = this.particleSystem.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = (Math.random() - 0.5) * 20;
                positions[i + 1] = Math.random() * 5 + 5;
                positions[i + 2] = (Math.random() - 0.5) * 20;
                
                velocities[i] = (Math.random() - 0.5) * 0.5;
                velocities[i + 1] = -Math.random() * 0.5;
                velocities[i + 2] = (Math.random() - 0.5) * 0.5;
            }
            
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    addWater() {
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const velocities = this.particleSystem.userData.velocities;
            
            // Add water at random positions above
            for (let i = 0; i < positions.length; i += 3) {
                if (Math.random() < 0.1) {
                    positions[i] = (Math.random() - 0.5) * 10;
                    positions[i + 1] = Math.random() * 3 + 8;
                    positions[i + 2] = (Math.random() - 0.5) * 10;
                    
                    velocities[i] = (Math.random() - 0.5) * 0.3;
                    velocities[i + 1] = -Math.random() * 0.2;
                    velocities[i + 2] = (Math.random() - 0.5) * 0.3;
                }
            }
            
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    getParticleCount() {
        return this.particleSystem ? this.particleSystem.geometry.attributes.position.array.length / 3 : 0;
    }
}
