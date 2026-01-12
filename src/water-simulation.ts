import { MeshBuilder, StandardMaterial, Color3, Color4, Vector3, ParticleSystem, DynamicTexture, Mesh, ShadowGenerator, Scene, AbstractMesh } from '@babylonjs/core';

export class WaterSimulation {
    private scene: Scene;
    private shadowGenerator: ShadowGenerator | null;
    private particles: any[];
    private particleSystem: ParticleSystem | null = null;
    private waterMesh: Mesh | null = null;
    
    // Simulation parameters
    private waterLevel: number = 0.5;
    private waveSpeed: number = 1.0;
    private viscosity: number = 0.1;
    private gravity: number = 9.8;
    private waterColor: Color3 = new Color3(0.29, 0.56, 0.89); // #4a90e2
    
    // Grid for water surface
    private gridSize: number = 32; // Reduced for better performance
    private gridSpacing: number = 1.0;
    private time: number = 0;
    
    constructor(scene: Scene, shadowGenerator: ShadowGenerator | null) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.particles = [];
        
        this.init();
    }
    
    private init(): void {
        this.createWaterMesh();
        this.createParticleSystem();
    }
    
    private createWaterMesh(): void {
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
        if ((waterMaterial as any).metallicFactor !== undefined) {
            (waterMaterial as any).metallicFactor = 0.1;
        }
        if ((waterMaterial as any).roughness !== undefined) {
            (waterMaterial as any).roughness = 0.2;
        }
        
        if (this.waterMesh) {
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
    }
    
    private createParticleSystem(): void {
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
        
        if (!this.particleSystem) return;
        
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
    
    public update(delta: number): void {
        this.time += delta * this.waveSpeed;
        
        // Animate water mesh vertices for waves
        if (this.waterMesh && this.waterMesh.userData && (this.waterMesh.userData as any).originalVertices) {
            const positions = this.waterMesh.getVerticesData('position');
            const originalVertices = (this.waterMesh.userData as any).originalVertices as Float32Array;
            
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
    
    public setWaterLevel(level: number): void {
        this.waterLevel = level;
        if (this.waterMesh) {
            // Position water at a visible height
            this.waterMesh.position.y = (level - 0.5) * 10;
        }
    }
    
    public setWaveSpeed(speed: number): void {
        this.waveSpeed = speed;
    }
    
    public setViscosity(viscosity: number): void {
        this.viscosity = viscosity;
    }
    
    public setGravity(gravity: number): void {
        this.gravity = gravity;
        if (this.particleSystem) {
            this.particleSystem.gravity.y = -gravity;
        }
    }
    
    public setWaterColor(color: Color3): void {
        this.waterColor = color;
        if (this.waterMesh && this.waterMesh.material) {
            (this.waterMesh.material as StandardMaterial).diffuseColor = color;
        }
        if (this.particleSystem) {
            this.particleSystem.color1 = new Color4(color.r, color.g, color.b, 1.0);
            this.particleSystem.color2 = new Color4(color.r * 0.9, color.g * 0.9, color.b * 0.9, 0.9);
        }
    }
    
    public reset(): void {
        if (this.particleSystem) {
            this.particleSystem.reset();
            // Restart to ensure particles are visible
            this.particleSystem.start();
        }
    }
    
    public addWater(): void {
        if (!this.particleSystem) return;
        
        // Create multiple burst emitters at random positions
        const burstCount = 5; // Number of water bursts
        const particlesPerBurst = 100; // Particles per burst
        
        for (let i = 0; i < burstCount; i++) {
            // Random position for water burst
            const x = (Math.random() - 0.5) * 15;
            const z = (Math.random() - 0.5) * 15;
            const y = 8 + Math.random() * 4; // Between 8 and 12
            
            // Create a temporary emitter at this position
            const burstEmitter = MeshBuilder.CreateBox('burstEmitter', { size: 0.1 }, this.scene);
            burstEmitter.isVisible = false;
            burstEmitter.position = new Vector3(x, y, z);
            
            // Create a temporary particle system for this burst
            const burstParticleSystem = new ParticleSystem('waterBurst', particlesPerBurst, this.scene);
            
            // Use the same texture
            if (this.particleSystem.particleTexture) {
                burstParticleSystem.particleTexture = this.particleSystem.particleTexture;
            }
            
            burstParticleSystem.emitter = burstEmitter;
            burstParticleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
            burstParticleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5);
            
            // Same colors as main system
            burstParticleSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
            burstParticleSystem.color2 = new Color4(this.waterColor.r * 0.9, this.waterColor.g * 0.9, this.waterColor.b * 0.9, 0.9);
            burstParticleSystem.colorDead = new Color4(0, 0, 0, 0.0);
            
            // Particle size
            burstParticleSystem.minSize = 0.2;
            burstParticleSystem.maxSize = 0.4;
            
            // Shorter lifetime for bursts
            burstParticleSystem.minLifeTime = 2;
            burstParticleSystem.maxLifeTime = 5;
            
            // High emission rate for burst
            burstParticleSystem.emitRate = particlesPerBurst * 10;
            
            // Physics
            burstParticleSystem.gravity = new Vector3(0, -this.gravity, 0);
            burstParticleSystem.direction1 = new Vector3(-0.5, -1, -0.5);
            burstParticleSystem.direction2 = new Vector3(0.5, -1.5, 0.5);
            
            burstParticleSystem.minAngularSpeed = 0;
            burstParticleSystem.maxAngularSpeed = Math.PI;
            
            burstParticleSystem.minEmitPower = 1.5;
            burstParticleSystem.maxEmitPower = 2.5;
            burstParticleSystem.updateSpeed = 0.01;
            
            burstParticleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            
            // Emit all particles quickly then stop
            burstParticleSystem.targetStopDuration = 0.1;
            
            // Start the burst
            burstParticleSystem.start();
            
            // Clean up after particles are done
            setTimeout(() => {
                burstParticleSystem.dispose();
                burstEmitter.dispose();
            }, 6000); // Clean up after 6 seconds
        }
        
        // Also temporarily increase main system emission rate
        const oldRate = this.particleSystem.emitRate;
        this.particleSystem.emitRate = oldRate * 2;
        setTimeout(() => {
            if (this.particleSystem) {
                this.particleSystem.emitRate = oldRate;
            }
        }, 1000);
    }
    
    public getParticleCount(): number {
        return this.particleSystem ? this.particleSystem.getActiveCount() : 0;
    }
}
