import * as THREE from 'three';
import { WaterSimulation } from './water-simulation.js';
import { ShapeManager } from './shape-manager.js';
import { CameraController } from './camera-controller.js';
import { UIManager } from './ui-manager.js';

class WaterSimulator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        
        this.waterSimulation = null;
        this.shapeManager = null;
        this.cameraController = null;
        this.uiManager = null;
        
        this.isPlaying = true;
        this.timeScale = 1.0;
        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Setup scene
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
        
        // Setup lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x4a90e2, 0.5, 30);
        pointLight.position.set(0, 15, 0);
        this.scene.add(pointLight);
        
        // Setup camera
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize managers
        this.waterSimulation = new WaterSimulation(this.scene);
        this.shapeManager = new ShapeManager(this.scene, this.waterSimulation);
        this.cameraController = new CameraController(this.camera, this.scene);
        this.uiManager = new UIManager(this);
        
        // Setup grid and axes
        this.setupHelpers();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Start animation loop
        this.animate();
    }
    
    setupHelpers() {
        // Grid
        const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
        gridHelper.name = 'grid';
        this.scene.add(gridHelper);
        
        // Axes
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.name = 'axes';
        this.scene.add(axesHelper);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.shapeManager.getAllShapes(), false);
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            this.shapeManager.selectShape(this.selectedObject);
        } else {
            this.selectedObject = null;
            this.shapeManager.deselectAll();
        }
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta() * this.timeScale;
        
        if (this.isPlaying) {
            this.waterSimulation.update(delta);
            this.shapeManager.update(delta);
        }
        
        this.cameraController.update(delta);
        this.uiManager.update();
        
        this.renderer.render(this.scene, this.camera);
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

// Initialize simulator
const simulator = new WaterSimulator();
