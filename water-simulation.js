import { MeshBuilder, StandardMaterial, Color3, Color4, Vector3, ParticleSystem, Texture, Mesh } from '@babylonjs/core';

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
        this.gridSize = 64;
        this.gridSpacing = 0.5;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.createWaterMesh();
        this.createParticleSystem();
    }
    
    createWaterMesh() {
        // Create water plane with high subdivision for waves
        this.waterMesh = MeshBuilder.CreateGround('waterMesh', {
            width: this.gridSize * this.gridSpacing,
            height: this.gridSize * this.gridSpacing,
            subdivisions: this.gridSize
        }, this.scene);
        
        // Create realistic water material
        const waterMaterial = new StandardMaterial('waterMaterial', this.scene);
        waterMaterial.diffuseColor = this.waterColor;
        waterMaterial.specularColor = new Color3(0.8, 0.9, 1.0);
        waterMaterial.emissiveColor = new Color3(0.1, 0.2, 0.3);
        waterMaterial.alpha = 0.85;
        waterMaterial.specularPower = 128;
        waterMaterial.backFaceCulling = false;
        
        this.waterMesh.material = waterMaterial;
        this.waterMesh.position.y = this.waterLevel * 10 - 5;
        this.waterMesh.receiveShadows = true;
        
        // Store original vertices for wave animation
        const positions = this.waterMesh.getVerticesData('position');
        this.waterMesh.userData = { 
            isWater: true, 
            originalVertices: new Float32Array(positions) 
        };
    }
    
    createParticleSystem() {
        // Create particle system
        this.particleSystem = new ParticleSystem('waterParticles', 2000, this.scene);
        
        // Create a simple white texture for particles
        const particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', this.scene);
        this.particleSystem.particleTexture = particleTexture;
        
        // Create invisible emitter
        const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
        emitter.isVisible = false;
        this.particleSystem.emitter = emitter;
        this.particleSystem.minEmitBox = new Vector3(-10, 8, -10);
        this.particleSystem.maxEmitBox = new Vector3(10, 12, 10);
        
        // Particle colors
        this.particleSystem.color1 = new Color4(this.waterColor.r, this.waterColor.g, this.waterColor.b, 1.0);
        this.particleSystem.color2 = new Color4(this.waterColor.r * 0.8, this.waterColor.g * 0.8, this.waterColor.b * 0.8, 0.8);
        this.particleSystem.colorDead = new Color4(0, 0, 0, 0.0);
        
        // Particle size
        this.particleSystem.minSize = 0.05;
        this.particleSystem.maxSize = 0.15;
        
        // Particle lifetime
        this.particleSystem.minLifeTime = 5;
        this.particleSystem.maxLifeTime = 10;
        
        // Emission rate
        this.particleSystem.emitRate = 200;
        
        // Physics
        this.particleSystem.gravity = new Vector3(0, -this.gravity, 0);
        this.particleSystem.direction1 = new Vector3(-0.5, -1, -0.5);
        this.particleSystem.direction2 = new Vector3(0.5, -1.5, 0.5);
        
        // Angular velocity
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = Math.PI;
        
        // Emit power
        this.particleSystem.minEmitPower = 0.5;
        this.particleSystem.maxEmitPower = 1.5;
        this.particleSystem.updateSpeed = 0.02;
        
        // Blend mode
        this.particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        
        // Start the particle system
        this.particleSystem.start();
    }
    
    update(delta) {
        this.time += delta * this.waveSpeed;
        
        // Animate water mesh vertices for waves
        if (this.waterMesh && this.waterMesh.userData.originalVertices) {
            const positions = this.waterMesh.getVerticesData('position');
            const originalVertices = this.waterMesh.userData.originalVertices;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = originalVertices[i];
                const z = originalVertices[i + 2];
                
                // Multiple wave functions for realistic water movement
                const wave1 = Math.sin(x * 0.5 + this.time * 2.0) * 0.1;
                const wave2 = Math.cos(z * 0.3 + this.time * 1.5) * 0.08;
                const wave3 = Math.sin((x + z) * 0.4 + this.time * 2.5) * 0.05;
                
                positions[i + 1] = originalVertices[i + 1] + wave1 + wave2 + wave3;
            }
            
            this.waterMesh.updateVerticesData('position', positions);
        }
        
        // Update particle system gravity
        if (this.particleSystem) {
            this.particleSystem.gravity.y = -this.gravity;
        }
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
        if (this.waterMesh && this.waterMesh.material) {
            this.waterMesh.material.diffuseColor = color;
        }
        if (this.particleSystem) {
            this.particleSystem.color1 = new Color4(color.r, color.g, color.b, 1.0);
            this.particleSystem.color2 = new Color4(color.r * 0.8, color.g * 0.8, color.b * 0.8, 0.8);
        }
    }
    
    reset() {
        if (this.particleSystem) {
            this.particleSystem.reset();
        }
    }
    
    addWater() {
        if (this.particleSystem) {
            // Temporarily increase emit rate to add more water
            const oldRate = this.particleSystem.emitRate;
            this.particleSystem.emitRate = 500;
            setTimeout(() => {
                this.particleSystem.emitRate = oldRate;
            }, 100);
        }
    }
    
    getParticleCount() {
        return this.particleSystem ? this.particleSystem.getActiveCount() : 0;
    }
}
