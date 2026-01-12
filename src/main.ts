import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, MeshBuilder, StandardMaterial, ShadowGenerator, DirectionalLight, PointLight, Mesh, AbstractMesh } from '@babylonjs/core';
import { WaterSimulation } from './water-simulation';
import { ShapeManager } from './shape-manager';
import { CameraController } from './camera-controller';
import { UIManager } from './ui-manager';
import type { IWaterSimulator } from './ui-manager';

export class WaterSimulator implements IWaterSimulator {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene | null = null;
    private camera: ArcRotateCamera | null = null;
    
    public waterSimulation: WaterSimulation | null = null;
    public shapeManager: ShapeManager | null = null;
    public cameraController: CameraController | null = null;
    public uiManager: UIManager | null = null;
    
    public isPlaying: boolean = true;
    public timeScale: number = 1.0;
    public selectedObject: AbstractMesh | null = null;
    
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'renderCanvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Get the simulation box container
        const simulationBox = document.getElementById('simulation-box');
        if (simulationBox) {
            simulationBox.appendChild(this.canvas);
        } else {
            // Fallback to canvas-container if simulation-box doesn't exist
            const container = document.getElementById('canvas-container');
            if (container) {
                container.appendChild(this.canvas);
            }
        }
        
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        
        this.init();
    }
    
    private init(): void {
        if (!this.engine) return;
        
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
                    if (this.waterSimulation) {
                        this.waterSimulation.update(delta);
                    }
                    if (this.shapeManager) {
                        this.shapeManager.update(delta);
                    }
                }
                
                if (this.cameraController) {
                    this.cameraController.update(delta);
                }
                if (this.uiManager) {
                    this.uiManager.update();
                }
                
                this.scene.render();
            }
        });
    }
    
    private setupHelpers(): void {
        if (!this.scene) return;
        
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
    
    public togglePlayPause(): boolean {
        this.isPlaying = !this.isPlaying;
        return this.isPlaying;
    }
    
    public resetWater(): void {
        if (this.waterSimulation) {
            this.waterSimulation.reset();
        }
    }
    
    public addWater(): void {
        if (this.waterSimulation) {
            this.waterSimulation.addWater();
        }
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
