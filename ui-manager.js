import * as THREE from 'three';

export class UIManager {
    constructor(simulator) {
        this.simulator = simulator;
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Water controls
        const waterLevelSlider = document.getElementById('water-level');
        const waveSpeedSlider = document.getElementById('wave-speed');
        const viscositySlider = document.getElementById('viscosity');
        const gravitySlider = document.getElementById('gravity');
        const waterColorPicker = document.getElementById('water-color');
        
        waterLevelSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('water-level-value').textContent = value.toFixed(2);
            this.simulator.waterSimulation.setWaterLevel(value);
        });
        
        waveSpeedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('wave-speed-value').textContent = value.toFixed(1);
            this.simulator.waterSimulation.setWaveSpeed(value);
        });
        
        viscositySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('viscosity-value').textContent = value.toFixed(2);
            this.simulator.waterSimulation.setViscosity(value);
        });
        
        gravitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('gravity-value').textContent = value.toFixed(1);
            this.simulator.waterSimulation.setGravity(value);
        });
        
        waterColorPicker.addEventListener('input', (e) => {
            const color = new THREE.Color(e.target.value);
            this.simulator.waterSimulation.setWaterColor(color);
        });
        
        document.getElementById('reset-water').addEventListener('click', () => {
            this.simulator.resetWater();
        });
        
        document.getElementById('add-water').addEventListener('click', () => {
            this.simulator.addWater();
        });
        
        // Shape controls
        const shapeTypeSelect = document.getElementById('shape-type');
        const sizeSlider = document.getElementById('size');
        
        shapeTypeSelect.addEventListener('change', (e) => {
            this.simulator.shapeManager.setShapeType(e.target.value);
        });
        
        sizeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('size-value').textContent = value.toFixed(1);
            this.simulator.shapeManager.setSize(value);
        });
        
        document.getElementById('add-shape').addEventListener('click', () => {
            this.simulator.shapeManager.createShape(
                this.simulator.shapeManager.shapeType,
                null,
                this.simulator.shapeManager.size
            );
        });
        
        document.getElementById('delete-selected').addEventListener('click', () => {
            this.simulator.shapeManager.deleteSelected();
        });
        
        document.getElementById('clear-all').addEventListener('click', () => {
            this.simulator.shapeManager.clearAll();
        });
        
        // Camera controls
        document.getElementById('view-top').addEventListener('click', () => {
            this.simulator.cameraController.setViewMode('top');
        });
        
        document.getElementById('view-front').addEventListener('click', () => {
            this.simulator.cameraController.setViewMode('front');
        });
        
        document.getElementById('view-side').addEventListener('click', () => {
            this.simulator.cameraController.setViewMode('side');
        });
        
        document.getElementById('view-free').addEventListener('click', () => {
            this.simulator.cameraController.setViewMode('free');
        });
        
        document.getElementById('view-follow').addEventListener('click', () => {
            this.simulator.cameraController.setViewMode('follow');
        });
        
        // Graphics controls
        const qualitySlider = document.getElementById('quality');
        const showGridCheckbox = document.getElementById('show-grid');
        const showAxesCheckbox = document.getElementById('show-axes');
        
        qualitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const qualities = ['Low', 'Medium', 'High'];
            document.getElementById('quality-value').textContent = qualities[value];
            
            // Adjust render quality
            if (value === 0) {
                this.simulator.renderer.setPixelRatio(1);
            } else if (value === 1) {
                this.simulator.renderer.setPixelRatio(1.5);
            } else {
                this.simulator.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }
        });
        
        showGridCheckbox.addEventListener('change', (e) => {
            const grid = this.simulator.scene.getObjectByName('grid');
            if (grid) grid.visible = e.target.checked;
        });
        
        showAxesCheckbox.addEventListener('change', (e) => {
            const axes = this.simulator.scene.getObjectByName('axes');
            if (axes) axes.visible = e.target.checked;
        });
        
        // Simulation controls
        const playPauseBtn = document.getElementById('play-pause');
        const timeScaleSlider = document.getElementById('time-scale');
        
        playPauseBtn.addEventListener('click', () => {
            const isPlaying = this.simulator.togglePlayPause();
            playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        });
        
        document.getElementById('step-forward').addEventListener('click', () => {
            if (!this.simulator.isPlaying) {
                const delta = 0.016; // One frame
                this.simulator.waterSimulation.update(delta);
                this.simulator.shapeManager.update(delta);
            }
        });
        
        timeScaleSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('time-scale-value').textContent = value.toFixed(1);
            this.simulator.timeScale = value;
        });
    }
    
    update() {
        // Update FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            document.getElementById('fps').textContent = this.fps;
        }
        
        // Update particle count
        const particleCount = this.simulator.waterSimulation.getParticleCount();
        document.getElementById('particle-count').textContent = particleCount;
        
        // Update shape count
        const shapeCount = this.simulator.shapeManager.getShapeCount();
        document.getElementById('shape-count').textContent = shapeCount;
    }
}
