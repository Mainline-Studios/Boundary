import { 
    MeshBuilder, 
    StandardMaterial, 
    Color3, 
    Color4, 
    Vector3, 
    ParticleSystem, 
    DynamicTexture, 
    Mesh, 
    ShadowGenerator, 
    Scene, 
    AbstractMesh,
    Texture,
    Engine,
    PointsCloudSystem,
    VertexBuffer,
    VertexData
} from '@babylonjs/core';

/**
 * Comprehensive Water Simulation System
 * This class handles all water rendering including particles, mesh, and physics
 */
export class WaterSimulation {
    private scene: Scene;
    private shadowGenerator: ShadowGenerator | null;
    private particles: any[] = [];
    private particleSystem: ParticleSystem | null = null;
    private waterMesh: Mesh | null = null;
    private backupParticleSystems: ParticleSystem[] = [];
    private waterDroplets: Mesh[] = [];
    
    // Simulation parameters
    private waterLevel: number = 0.5;
    private waveSpeed: number = 1.0;
    private viscosity: number = 0.1;
    private gravity: number = 9.8;
    private waterColor: Color3 = new Color3(0.29, 0.56, 0.89); // #4a90e2
    
    // Grid for water surface
    private gridSize: number = 64;
    private gridSpacing: number = 1.0;
    private time: number = 0;
    private initialized: boolean = false;
    
    // Debug
    private debugMode: boolean = true;
    
    constructor(scene: Scene, shadowGenerator: ShadowGenerator | null) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        
        console.log('[WaterSimulation] Initializing water simulation...');
        this.init();
    }
    
    private init(): void {
        try {
            console.log('[WaterSimulation] Creating water mesh...');
            this.createWaterMesh();
            
            console.log('[WaterSimulation] Creating particle system...');
            this.createParticleSystem();
            
            // Create backup systems
            console.log('[WaterSimulation] Creating backup particle systems...');
            this.createBackupParticleSystems();
            
            // Create visible water droplets as fallback
            console.log('[WaterSimulation] Creating visible water droplets...');
            this.createVisibleWaterDroplets();
            
            this.initialized = true;
            console.log('[WaterSimulation] Water simulation initialized successfully!');
        } catch (error) {
            console.error('[WaterSimulation] Initialization error:', error);
            // Try fallback initialization
            this.fallbackInit();
        }
    }
    
    private fallbackInit(): void {
        console.log('[WaterSimulation] Attempting fallback initialization...');
        try {
            // Simple water mesh
            this.waterMesh = MeshBuilder.CreateGround('waterMeshFallback', {
                width: 20,
                height: 20,
                subdivisions: 16
            }, this.scene);
            
            const material = new StandardMaterial('waterMaterialFallback', this.scene);
            material.diffuseColor = this.waterColor;
            material.alpha = 1.0;
            material.emissiveColor = new Color3(0.2, 0.4, 0.6);
            
            if (this.waterMesh) {
                this.waterMesh.material = material;
                this.waterMesh.position.y = 0;
                this.waterMesh.isVisible = true;
            }
        } catch (error) {
            console.error('[WaterSimulation] Fallback initialization failed:', error);
        }
    }
    
    private createWaterMesh(): void {
        try {
            const waterSize = 20;
            this.waterMesh = MeshBuilder.CreateGround('waterMesh', {
                width: waterSize,
                height: waterSize,
                subdivisions: this.gridSize
            }, this.scene);
            
            if (!this.waterMesh) {
                console.error('[WaterSimulation] Failed to create water mesh!');
                return;
            }
            
            // Create highly visible water material
            const waterMaterial = new StandardMaterial('waterMaterial', this.scene);
            const brightWaterColor = new Color3(
                Math.min(this.waterColor.r * 2.0, 1.0),
                Math.min(this.waterColor.g * 2.0, 1.0),
                Math.min(this.waterColor.b * 2.0, 1.0)
            );
            
            waterMaterial.diffuseColor = brightWaterColor;
            waterMaterial.specularColor = new Color3(1.0, 1.0, 1.0);
            waterMaterial.emissiveColor = new Color3(0.2, 0.4, 0.6); // Very bright emissive
            waterMaterial.alpha = 1.0; // Fully opaque for visibility
            waterMaterial.specularPower = 256;
            waterMaterial.backFaceCulling = false;
            waterMaterial.disableLighting = false;
            
            this.waterMesh.material = waterMaterial;
            this.waterMesh.position.y = (this.waterLevel - 0.5) * 10;
            this.waterMesh.receiveShadows = true;
            this.waterMesh.rotation.x = 0;
            this.waterMesh.isVisible = true;
            this.waterMesh.setEnabled(true);
            
            // Force visibility
            this.waterMesh.visibility = 1.0;
            
            // Store original vertices
            const positions = this.waterMesh.getVerticesData('position');
            if (positions) {
                this.waterMesh.userData = { 
                    isWater: true, 
                    originalVertices: new Float32Array(positions) 
                };
                console.log('[WaterSimulation] Water mesh created with', positions.length / 3, 'vertices');
            }
            
            console.log('[WaterSimulation] Water mesh created successfully at y:', this.waterMesh.position.y);
        } catch (error) {
            console.error('[WaterSimulation] Error creating water mesh:', error);
        }
    }
    
    private createParticleSystem(): void {
        try {
            console.log('[WaterSimulation] Creating main particle system...');
            
            // Create particle system with maximum capacity
            this.particleSystem = new ParticleSystem('waterParticles', 5000, this.scene);
            
            // Create particle texture
            const particleTextureSize = 128;
            const particleTexture = new DynamicTexture('particleTexture', particleTextureSize, this.scene, false);
            const ctx = particleTexture.getContext();
            
            // Draw a bright, visible circle
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            ctx.beginPath();
            ctx.arc(particleTextureSize / 2, particleTextureSize / 2, particleTextureSize / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(74, 144, 226, 0.8)';
            ctx.fill();
            particleTexture.update();
            
            this.particleSystem.particleTexture = particleTexture;
            
            // Create multiple emitters for better coverage
            const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
            emitter.isVisible = false;
            emitter.position.y = 10;
            this.particleSystem.emitter = emitter;
            
            // Large emission area
            this.particleSystem.minEmitBox = new Vector3(-10, 0, -10);
            this.particleSystem.maxEmitBox = new Vector3(10, 3, 10);
            
            // Bright, visible colors
            this.particleSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
            this.particleSystem.color2 = new Color4(this.waterColor.r * 0.95, this.waterColor.g * 0.95, this.waterColor.b * 0.95, 1.0);
            this.particleSystem.colorDead = new Color4(0, 0, 0, 0.0);
            
            // Large, visible particles
            this.particleSystem.minSize = 0.3;
            this.particleSystem.maxSize = 0.6;
            
            // Particle lifetime
            this.particleSystem.minLifeTime = 4;
            this.particleSystem.maxLifeTime = 8;
            
            // High emission rate
            this.particleSystem.emitRate = 500;
            
            // Physics
            this.particleSystem.gravity = new Vector3(0, -this.gravity, 0);
            this.particleSystem.direction1 = new Vector3(-0.5, -1.2, -0.5);
            this.particleSystem.direction2 = new Vector3(0.5, -1.8, 0.5);
            
            // Angular velocity
            this.particleSystem.minAngularSpeed = 0;
            this.particleSystem.maxAngularSpeed = Math.PI * 2;
            
            // Emit power
            this.particleSystem.minEmitPower = 1.5;
            this.particleSystem.maxEmitPower = 3.0;
            this.particleSystem.updateSpeed = 0.005; // Faster updates
            
            // Blend mode
            this.particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
            
            // Never stop
            this.particleSystem.targetStopDuration = 0;
            
            // Start immediately
            console.log('[WaterSimulation] Starting particle system...');
            this.particleSystem.start();
            
            // Verify it's running
            setTimeout(() => {
                if (this.particleSystem) {
                    const activeCount = this.particleSystem.getActiveCount();
                    console.log('[WaterSimulation] Particle system active count:', activeCount);
                    if (activeCount === 0) {
                        console.warn('[WaterSimulation] No active particles! Restarting...');
                        this.particleSystem.start();
                    }
                }
            }, 1000);
            
            console.log('[WaterSimulation] Main particle system created and started');
        } catch (error) {
            console.error('[WaterSimulation] Error creating particle system:', error);
            // Try simpler fallback
            this.createSimpleParticleSystem();
        }
    }
    
    private createSimpleParticleSystem(): void {
        try {
            console.log('[WaterSimulation] Creating simple fallback particle system...');
            this.particleSystem = new ParticleSystem('waterParticlesSimple', 1000, this.scene);
            
            const emitter = MeshBuilder.CreateBox('simpleEmitter', { size: 1 }, this.scene);
            emitter.isVisible = false;
            emitter.position.y = 10;
            this.particleSystem.emitter = emitter;
            
            this.particleSystem.minEmitBox = new Vector3(-5, 0, -5);
            this.particleSystem.maxEmitBox = new Vector3(5, 2, 5);
            
            this.particleSystem.color1 = new Color4(0.3, 0.6, 1.0, 1.0);
            this.particleSystem.color2 = new Color4(0.2, 0.5, 0.9, 1.0);
            this.particleSystem.colorDead = new Color4(0, 0, 0, 0);
            
            this.particleSystem.minSize = 0.5;
            this.particleSystem.maxSize = 1.0;
            this.particleSystem.minLifeTime = 3;
            this.particleSystem.maxLifeTime = 6;
            this.particleSystem.emitRate = 200;
            this.particleSystem.gravity = new Vector3(0, -9.8, 0);
            this.particleSystem.direction1 = new Vector3(-0.3, -1, -0.3);
            this.particleSystem.direction2 = new Vector3(0.3, -1.5, 0.3);
            this.particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            
            this.particleSystem.start();
            console.log('[WaterSimulation] Simple particle system started');
        } catch (error) {
            console.error('[WaterSimulation] Simple particle system failed:', error);
        }
    }
    
    private createBackupParticleSystems(): void {
        // Create 3 backup particle systems at different positions
        for (let i = 0; i < 3; i++) {
            try {
                const backupSystem = new ParticleSystem(`backupParticles${i}`, 1000, this.scene);
                
                const emitter = MeshBuilder.CreateBox(`backupEmitter${i}`, { size: 0.1 }, this.scene);
                emitter.isVisible = false;
                emitter.position = new Vector3(
                    (Math.random() - 0.5) * 10,
                    8 + Math.random() * 4,
                    (Math.random() - 0.5) * 10
                );
                backupSystem.emitter = emitter;
                
                backupSystem.minEmitBox = new Vector3(-2, 0, -2);
                backupSystem.maxEmitBox = new Vector3(2, 1, 2);
                
                if (this.particleSystem && this.particleSystem.particleTexture) {
                    backupSystem.particleTexture = this.particleSystem.particleTexture;
                }
                
                backupSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
                backupSystem.color2 = new Color4(this.waterColor.r * 0.9, this.waterColor.g * 0.9, this.waterColor.b * 0.9, 0.9);
                backupSystem.colorDead = new Color4(0, 0, 0, 0);
                
                backupSystem.minSize = 0.2;
                backupSystem.maxSize = 0.5;
                backupSystem.minLifeTime = 3;
                backupSystem.maxLifeTime = 6;
                backupSystem.emitRate = 150;
                backupSystem.gravity = new Vector3(0, -this.gravity, 0);
                backupSystem.direction1 = new Vector3(-0.3, -1, -0.3);
                backupSystem.direction2 = new Vector3(0.3, -1.5, 0.3);
                backupSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
                
                backupSystem.start();
                this.backupParticleSystems.push(backupSystem);
            } catch (error) {
                console.warn(`[WaterSimulation] Backup system ${i} failed:`, error);
            }
        }
        console.log('[WaterSimulation] Created', this.backupParticleSystems.length, 'backup particle systems');
    }
    
    private createVisibleWaterDroplets(): void {
        // Create visible sphere meshes as water droplets
        for (let i = 0; i < 50; i++) {
            try {
                const droplet = MeshBuilder.CreateSphere(`waterDroplet${i}`, {
                    diameter: 0.3,
                    segments: 8
                }, this.scene);
                
                const material = new StandardMaterial(`dropletMaterial${i}`, this.scene);
                material.diffuseColor = this.waterColor;
                material.emissiveColor = new Color3(0.1, 0.2, 0.4);
                material.alpha = 0.9;
                droplet.material = material;
                
                droplet.position = new Vector3(
                    (Math.random() - 0.5) * 15,
                    5 + Math.random() * 10,
                    (Math.random() - 0.5) * 15
                );
                
                droplet.userData = {
                    velocity: new Vector3(
                        (Math.random() - 0.5) * 0.5,
                        -Math.random() * 2,
                        (Math.random() - 0.5) * 0.5
                    ),
                    isDroplet: true
                };
                
                this.waterDroplets.push(droplet);
            } catch (error) {
                console.warn(`[WaterSimulation] Droplet ${i} creation failed:`, error);
            }
        }
        console.log('[WaterSimulation] Created', this.waterDroplets.length, 'visible water droplets');
    }
    
    public update(delta: number): void {
        if (!this.initialized) return;
        
        this.time += delta * this.waveSpeed;
        
        // Update water mesh waves
        this.updateWaterMesh(delta);
        
        // Update particle systems
        if (this.particleSystem) {
            this.particleSystem.gravity.y = -this.gravity;
        }
        
        // Update backup systems
        for (const system of this.backupParticleSystems) {
            if (system) {
                system.gravity.y = -this.gravity;
            }
        }
        
        // Update visible droplets
        this.updateWaterDroplets(delta);
    }
    
    private updateWaterMesh(delta: number): void {
        if (this.waterMesh && this.waterMesh.userData && (this.waterMesh.userData as any).originalVertices) {
            const positions = this.waterMesh.getVerticesData('position');
            const originalVertices = (this.waterMesh.userData as any).originalVertices as Float32Array;
            
            if (positions && originalVertices && positions.length === originalVertices.length) {
                for (let i = 0; i < positions.length; i += 3) {
                    const x = originalVertices[i];
                    const z = originalVertices[i + 2];
                    
                    // Multiple wave functions
                    const wave1 = Math.sin(x * 0.3 + this.time * 2.0) * 0.2;
                    const wave2 = Math.cos(z * 0.25 + this.time * 1.5) * 0.15;
                    const wave3 = Math.sin((x + z) * 0.2 + this.time * 2.5) * 0.1;
                    
                    positions[i + 1] = originalVertices[i + 1] + wave1 + wave2 + wave3;
                }
                
                this.waterMesh.updateVerticesData('position', positions);
            }
        }
    }
    
    private updateWaterDroplets(delta: number): void {
        const groundLevel = (this.waterLevel - 0.5) * 10 - 1;
        
        for (const droplet of this.waterDroplets) {
            if (droplet.userData && droplet.userData.velocity) {
                const vel = droplet.userData.velocity as Vector3;
                
                // Apply gravity
                vel.y -= this.gravity * delta;
                
                // Update position
                droplet.position.addInPlace(vel.scale(delta));
                
                // Bounce on ground
                if (droplet.position.y < groundLevel) {
                    droplet.position.y = groundLevel;
                    vel.y *= -0.3;
                    vel.x *= 0.8;
                    vel.z *= 0.8;
                }
                
                // Reset if too low
                if (droplet.position.y < -10) {
                    droplet.position.set(
                        (Math.random() - 0.5) * 15,
                        10 + Math.random() * 5,
                        (Math.random() - 0.5) * 15
                    );
                    vel.set(
                        (Math.random() - 0.5) * 0.5,
                        -Math.random() * 2,
                        (Math.random() - 0.5) * 0.5
                    );
                }
            }
        }
    }
    
    public setWaterLevel(level: number): void {
        this.waterLevel = level;
        if (this.waterMesh) {
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
        for (const system of this.backupParticleSystems) {
            if (system) {
                system.gravity.y = -gravity;
            }
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
        console.log('[WaterSimulation] Resetting water...');
        if (this.particleSystem) {
            this.particleSystem.reset();
            this.particleSystem.start();
        }
        for (const system of this.backupParticleSystems) {
            if (system) {
                system.reset();
                system.start();
            }
        }
    }
    
    public addWater(): void {
        console.log('[WaterSimulation] Adding water...');
        
        // Increase main particle system
        if (this.particleSystem) {
            const oldRate = this.particleSystem.emitRate;
            this.particleSystem.emitRate = oldRate * 3;
            setTimeout(() => {
                if (this.particleSystem) {
                    this.particleSystem.emitRate = oldRate;
                }
            }, 2000);
        }
        
        // Create multiple burst systems
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createWaterBurst(
                    (Math.random() - 0.5) * 15,
                    8 + Math.random() * 4,
                    (Math.random() - 0.5) * 15
                );
            }, i * 100);
        }
    }
    
    private createWaterBurst(x: number, y: number, z: number): void {
        try {
            const burstSystem = new ParticleSystem('waterBurst', 200, this.scene);
            
            const emitter = MeshBuilder.CreateBox('burstEmitter', { size: 0.1 }, this.scene);
            emitter.isVisible = false;
            emitter.position = new Vector3(x, y, z);
            burstSystem.emitter = emitter;
            
            burstSystem.minEmitBox = new Vector3(-1, 0, -1);
            burstSystem.maxEmitBox = new Vector3(1, 1, 1);
            
            if (this.particleSystem && this.particleSystem.particleTexture) {
                burstSystem.particleTexture = this.particleSystem.particleTexture;
            }
            
            burstSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
            burstSystem.color2 = new Color4(this.waterColor.r * 0.9, this.waterColor.g * 0.9, this.waterColor.b * 0.9, 0.9);
            burstSystem.colorDead = new Color4(0, 0, 0, 0);
            
            burstSystem.minSize = 0.3;
            burstSystem.maxSize = 0.6;
            burstSystem.minLifeTime = 2;
            burstSystem.maxLifeTime = 5;
            burstSystem.emitRate = 500;
            burstSystem.gravity = new Vector3(0, -this.gravity, 0);
            burstSystem.direction1 = new Vector3(-0.5, -1, -0.5);
            burstSystem.direction2 = new Vector3(0.5, -1.5, 0.5);
            burstSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            burstSystem.targetStopDuration = 0.2;
            
            burstSystem.start();
            
            setTimeout(() => {
                burstSystem.dispose();
                emitter.dispose();
            }, 6000);
        } catch (error) {
            console.warn('[WaterSimulation] Burst creation failed:', error);
        }
    }
    
    public getParticleCount(): number {
        let count = 0;
        if (this.particleSystem) {
            count += this.particleSystem.getActiveCount();
        }
        for (const system of this.backupParticleSystems) {
            if (system) {
                count += system.getActiveCount();
            }
        }
        return count;
    }
}
