import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, MeshBuilder, StandardMaterial, ShadowGenerator, DirectionalLight, PointLight } from '@babylonjs/core';
import { WaterSimulation } from './water-simulation.js';
import { ShapeManager } from './shape-manager.js';
import { CameraController } from './camera-controller.js';
import { UIManager } from './ui-manager.js';

class WaterSimulator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'renderCanvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.getElementById('canvas-container').appendChild(this.canvas);
        
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        
        this.scene = null;
        this.camera = null;
        
        this.waterSimulation = null;
        this.shapeManager = null;
        this.cameraController = null;
        this.uiManager = null;
        
        this.isPlaying = true;
        this.timeScale = 1.0;
        this.selectedObject = null;
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color3(0.1, 0.1, 0.15);
        this.scene.fogMode = Scene.FOGMODE_EXP;
        this.scene.fogDensity = 0.02;
        this.scene.fogColor = new Color3(0.1, 0.1, 0.15);
        
        // Setup camera - position to see water clearly
        this.camera = new ArcRotateCamera(
            'camera',
            -Math.PI / 2.5, // Slightly adjusted angle
            Math.PI / 3.5,  // Better viewing angle
            25,              // Further back to see more
            new Vector3(0, 2, 0), // Look at water level
            this.scene
        );
        this.camera.attachControls(this.canvas, true);
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 50;
        this.camera.wheelDeltaPercentage = 0.01;
        
        // Setup lighting
        const hemisphericLight = new HemisphericLight('hemisphericLight', new Vector3(0, 1, 0), this.scene);
        hemisphericLight.intensity = 0.6;
        hemisphericLight.diffuse = new Color3(1, 1, 1);
        
        const directionalLight = new DirectionalLight('directionalLight', new Vector3(-1, -1, -1), this.scene);
        directionalLight.position = new Vector3(10, 20, 10);
        directionalLight.intensity = 0.8;
        directionalLight.diffuse = new Color3(1, 1, 1);
        
        // Enable shadows
        directionalLight.shadowMinZ = 1;
        directionalLight.shadowMaxZ = 50;
        const shadowGenerator = new ShadowGenerator(2048, directionalLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
        
        const pointLight = new PointLight('pointLight', new Vector3(0, 15, 0), this.scene);
        pointLight.intensity = 0.5;
        pointLight.diffuse = new Color3(0.3, 0.5, 0.9);
        pointLight.range = 30;
        
        // Initialize managers
        this.waterSimulation = new WaterSimulation(this.scene, shadowGenerator);
        this.shapeManager = new ShapeManager(this.scene, this.waterSimulation, shadowGenerator);
        this.cameraController = new CameraController(this.camera, this.scene);
        this.uiManager = new UIManager(this);
        
        // Setup helpers
        this.setupHelpers();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            if (this.scene) {
                const delta = this.engine.getDeltaTime() / 1000 * this.timeScale;
                
                if (this.isPlaying) {
                    this.waterSimulation.update(delta);
                    this.shapeManager.update(delta);
                }
                
                this.cameraController.update(delta);
                this.uiManager.update();
                
                this.scene.render();
            }
        });
    }
    
    setupHelpers() {
        // Grid - position it below water level
        const grid = MeshBuilder.CreateGround('grid', { width: 30, height: 30, subdivisions: 30 }, this.scene);
        const gridMaterial = new StandardMaterial('gridMaterial', this.scene);
        gridMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
        gridMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05);
        grid.material = gridMaterial;
        grid.position.y = -5; // Position grid below water
        grid.receiveShadows = true;
        grid.userData = { isHelper: true };
        
        // Axes helper
        const axesSize = 5;
        const axisX = MeshBuilder.CreateLines('axisX', {
            points: [Vector3.Zero(), new Vector3(axesSize, 0, 0)],
            colors: [new Color3(1, 0, 0), new Color3(1, 0, 0)]
        }, this.scene);
        const axisY = MeshBuilder.CreateLines('axisY', {
            points: [Vector3.Zero(), new Vector3(0, axesSize, 0)],
            colors: [new Color3(0, 1, 0), new Color3(0, 1, 0)]
        }, this.scene);
        const axisZ = MeshBuilder.CreateLines('axisZ', {
            points: [Vector3.Zero(), new Vector3(0, 0, axesSize)],
            colors: [new Color3(0, 0, 1), new Color3(0, 0, 1)]
        }, this.scene);
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        return this.isPlaying;
    }
    
    resetWater() {
        this.waterSimulation.reset();
    }
    
    addWater() {
        this.waterSimulation.addWater();
    }
}

// Initialize simulator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WaterSimulator();
    });
} else {
    new WaterSimulator();
}
