import { MeshBuilder, StandardMaterial, Color3, Color4, Vector3, ParticleSystem, Texture, Mesh, DynamicTexture } from '@babylonjs/core';

export class WaterSimulation {
    constructor(scene, shadowGenerator) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.particles = [];
        this.particleSystem = null;
        this.waterMesh = null;
        
        // Simulation parameters
        this.waterLevel = 0.5;
        this.waveSpeed = 1.0;
        this.viscosity = 0.1;
        this.gravity = 9.8;
        this.waterColor = new Color3(0.29, 0.56, 0.89); // #4a90e2
        
        // Grid for water surface
        this.gridSize = 32; // Reduced for better performance
        this.gridSpacing = 1.0;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.createWaterMesh();
        this.createParticleSystem();
    }
    
    createWaterMesh() {
        // Create water plane with subdivision for waves
        const waterSize = 20;
        this.waterMesh = MeshBuilder.CreateGround('waterMesh', {
            width: waterSize,
            height: waterSize,
            subdivisions: this.gridSize
        }, this.scene);
        
        // Create realistic water material with better visibility
        const waterMaterial = new StandardMaterial('waterMaterial', this.scene);
        // Make water color brighter and more visible
        const brightWaterColor = new Color3(
            Math.min(this.waterColor.r * 1.5, 1.0),
            Math.min(this.waterColor.g * 1.5, 1.0),
            Math.min(this.waterColor.b * 1.5, 1.0)
        );
        waterMaterial.diffuseColor = brightWaterColor;
        waterMaterial.specularColor = new Color3(1.0, 1.0, 1.0);
        waterMaterial.emissiveColor = new Color3(0.1, 0.2, 0.3); // More emissive for visibility
        waterMaterial.alpha = 0.9; // More opaque for better visibility
        waterMaterial.specularPower = 256;
        waterMaterial.backFaceCulling = false;
        
        // Make it more reflective and visible
        if (waterMaterial.metallicFactor !== undefined) {
            waterMaterial.metallicFactor = 0.1;
        }
        if (waterMaterial.roughness !== undefined) {
            waterMaterial.roughness = 0.2;
        }
        
        this.waterMesh.material = waterMaterial;
        // Position water at a visible height (0 = center, positive = up)
        this.waterMesh.position.y = (this.waterLevel - 0.5) * 10; // Range from -5 to +5
        this.waterMesh.receiveShadows = true;
        this.waterMesh.rotation.x = 0; // Ensure it's flat
        
        // Make sure it's visible
        this.waterMesh.isVisible = true;
        this.waterMesh.setEnabled(true);
        
        // Store original vertices for wave animation
        const positions = this.waterMesh.getVerticesData('position');
        if (positions) {
            this.waterMesh.userData = { 
                isWater: true, 
                originalVertices: new Float32Array(positions) 
            };
        }
    }
    
    createParticleSystem() {
        try {
            // Create particle system with more visible particles
            this.particleSystem = new ParticleSystem('waterParticles', 3000, this.scene);
            
            // Create a visible particle texture using DynamicTexture
            const particleTextureSize = 64;
            const particleTexture = new DynamicTexture('particleTexture', particleTextureSize, this.scene, false);
            const ctx = particleTexture.getContext();
            
            // Draw a circle for particles
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(particleTextureSize / 2, particleTextureSize / 2, particleTextureSize / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            particleTexture.update();
            
            this.particleSystem.particleTexture = particleTexture;
        } catch (error) {
            console.warn('Particle system creation error:', error);
            // Create a simpler fallback
            this.particleSystem = new ParticleSystem('waterParticles', 1000, this.scene);
        }
        
        // Create emitter mesh
        const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
        emitter.isVisible = false;
        emitter.position.y = 8; // Start high
        this.particleSystem.emitter = emitter;
        this.particleSystem.minEmitBox = new Vector3(-8, 0, -8);
        this.particleSystem.maxEmitBox = new Vector3(8, 2, 8);
        
        // Particle colors - make them more visible
        this.particleSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
        this.particleSystem.color2 = new Color4(this.waterColor.r * 0.9, this.waterColor.g * 0.9, this.waterColor.b * 0.9, 0.9);
        this.particleSystem.colorDead = new Color4(0, 0, 0, 0.0);
        
        // Particle size - make them bigger and more visible
        this.particleSystem.minSize = 0.2;
        this.particleSystem.maxSize = 0.4;
        
        // Particle lifetime
        this.particleSystem.minLifeTime = 3;
        this.particleSystem.maxLifeTime = 6;
        
        // Emission rate - more particles
        this.particleSystem.emitRate = 300;
        
        // Physics
        this.particleSystem.gravity = new Vector3(0, -this.gravity, 0);
        this.particleSystem.direction1 = new Vector3(-0.3, -1, -0.3);
        this.particleSystem.direction2 = new Vector3(0.3, -1.5, 0.3);
        
        // Angular velocity
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = Math.PI;
        
        // Emit power
        this.particleSystem.minEmitPower = 1.0;
        this.particleSystem.maxEmitPower = 2.0;
        this.particleSystem.updateSpeed = 0.01;
        
        // Blend mode for better visibility
        this.particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        
        // Target stop duration (0 = infinite)
        this.particleSystem.targetStopDuration = 0;
        
        // Start the particle system immediately
        try {
            this.particleSystem.start();
        } catch (error) {
            console.warn('Particle system start error:', error);
        }
    }
    
    update(delta) {
        this.time += delta * this.waveSpeed;
        
        // Animate water mesh vertices for waves
        if (this.waterMesh && this.waterMesh.userData && this.waterMesh.userData.originalVertices) {
            const positions = this.waterMesh.getVerticesData('position');
            const originalVertices = this.waterMesh.userData.originalVertices;
            
            if (positions && originalVertices) {
                for (let i = 0; i < positions.length; i += 3) {
                    const x = originalVertices[i];
                    const z = originalVertices[i + 2];
                    
                    // Multiple wave functions for realistic water movement
                    const wave1 = Math.sin(x * 0.3 + this.time * 2.0) * 0.15;
                    const wave2 = Math.cos(z * 0.25 + this.time * 1.5) * 0.12;
                    const wave3 = Math.sin((x + z) * 0.2 + this.time * 2.5) * 0.08;
                    
                    positions[i + 1] = originalVertices[i + 1] + wave1 + wave2 + wave3;
                }
                
                this.waterMesh.updateVerticesData('position', positions);
                this.waterMesh.updateVerticesData('normal', null); // Recalculate normals
            }
        }
        
        // Update particle system gravity
        if (this.particleSystem) {
            this.particleSystem.gravity.y = -this.gravity;
        }
    }
    
    setWaterLevel(level) {
        this.waterLevel = level;
        if (this.waterMesh) {
            // Position water at a visible height
            this.waterMesh.position.y = (level - 0.5) * 10;
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
        if (this.particleSystem) {
            this.particleSystem.gravity.y = -gravity;
        }
    }
    
    setWaterColor(color) {
        this.waterColor = color;
        if (this.waterMesh && this.waterMesh.material) {
            this.waterMesh.material.diffuseColor = color;
        }
        if (this.particleSystem) {
            this.particleSystem.color1 = new Color4(color.r, color.g, color.b, 1.0);
            this.particleSystem.color2 = new Color4(color.r * 0.9, color.g * 0.9, color.b * 0.9, 0.9);
        }
    }
    
    reset() {
        if (this.particleSystem) {
            this.particleSystem.reset();
            // Restart to ensure particles are visible
            this.particleSystem.start();
        }
    }
    
    addWater() {
        if (this.particleSystem) {
            // Temporarily increase emit rate to add more water
            const oldRate = this.particleSystem.emitRate;
            this.particleSystem.emitRate = 800;
            setTimeout(() => {
                this.particleSystem.emitRate = oldRate;
            }, 200);
        }
    }
    
    getParticleCount() {
        return this.particleSystem ? this.particleSystem.getActiveCount() : 0;
    }
}
