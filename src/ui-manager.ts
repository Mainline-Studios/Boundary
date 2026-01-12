import { Color3 } from '@babylonjs/core';

// Forward declaration to avoid circular dependency
export interface IWaterSimulator {
    waterSimulation: any;
    shapeManager: any;
    cameraController: any;
    engine: any;
    scene: any;
    isPlaying: boolean;
    timeScale: number;
    togglePlayPause(): boolean;
    resetWater(): void;
    addWater(): void;
}

export class UIManager {
    private simulator: IWaterSimulator;
    private fps: number = 0;
    private frameCount: number = 0;
    private lastTime: number = performance.now();
    
    constructor(simulator: IWaterSimulator) {
        this.simulator = simulator;
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // Water controls
        const waterLevelSlider = document.getElementById('water-level') as HTMLInputElement;
        const waveSpeedSlider = document.getElementById('wave-speed') as HTMLInputElement;
        const viscositySlider = document.getElementById('viscosity') as HTMLInputElement;
        const gravitySlider = document.getElementById('gravity') as HTMLInputElement;
        const waterColorPicker = document.getElementById('water-color') as HTMLInputElement;
        
        if (waterLevelSlider) {
            waterLevelSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('water-level-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
                if (this.simulator.waterSimulation) {
                    this.simulator.waterSimulation.setWaterLevel(value);
                }
            });
        }
        
        if (waveSpeedSlider) {
            waveSpeedSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('wave-speed-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(1);
                if (this.simulator.waterSimulation) {
                    this.simulator.waterSimulation.setWaveSpeed(value);
                }
            });
        }
        
        if (viscositySlider) {
            viscositySlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('viscosity-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
                if (this.simulator.waterSimulation) {
                    this.simulator.waterSimulation.setViscosity(value);
                }
            });
        }
        
        if (gravitySlider) {
            gravitySlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('gravity-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(1);
                if (this.simulator.waterSimulation) {
                    this.simulator.waterSimulation.setGravity(value);
                }
            });
        }
        
        if (waterColorPicker) {
            waterColorPicker.addEventListener('input', (e) => {
                const hex = (e.target as HTMLInputElement).value;
                const r = parseInt(hex.substr(1, 2), 16) / 255;
                const g = parseInt(hex.substr(3, 2), 16) / 255;
                const b = parseInt(hex.substr(5, 2), 16) / 255;
                const color = new Color3(r, g, b);
                if (this.simulator.waterSimulation) {
                    this.simulator.waterSimulation.setWaterColor(color);
                }
            });
        }
        
        const resetWaterBtn = document.getElementById('reset-water');
        if (resetWaterBtn) {
            resetWaterBtn.addEventListener('click', () => {
                this.simulator.resetWater();
            });
        }
        
        const addWaterBtn = document.getElementById('add-water');
        if (addWaterBtn) {
            addWaterBtn.addEventListener('click', () => {
                this.simulator.addWater();
            });
        }
        
        // Shape controls
        const shapeTypeSelect = document.getElementById('shape-type') as HTMLSelectElement;
        const sizeSlider = document.getElementById('size') as HTMLInputElement;
        
        if (shapeTypeSelect) {
            shapeTypeSelect.addEventListener('change', (e) => {
                if (this.simulator.shapeManager) {
                    this.simulator.shapeManager.setShapeType((e.target as HTMLSelectElement).value);
                }
            });
        }
        
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('size-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(1);
                if (this.simulator.shapeManager) {
                    this.simulator.shapeManager.setSize(value);
                }
            });
        }
        
        const addShapeBtn = document.getElementById('add-shape');
        if (addShapeBtn && this.simulator.shapeManager) {
            addShapeBtn.addEventListener('click', () => {
                if (this.simulator.shapeManager) {
                    this.simulator.shapeManager.createShape(
                        this.simulator.shapeManager.shapeType,
                        null,
                        this.simulator.shapeManager.size
                    );
                }
            });
        }
        
        const deleteSelectedBtn = document.getElementById('delete-selected');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                if (this.simulator.shapeManager) {
                    this.simulator.shapeManager.deleteSelected();
                }
            });
        }
        
        const clearAllBtn = document.getElementById('clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (this.simulator.shapeManager) {
                    this.simulator.shapeManager.clearAll();
                }
            });
        }
        
        // Camera controls
        const viewTopBtn = document.getElementById('view-top');
        if (viewTopBtn) {
            viewTopBtn.addEventListener('click', () => {
                if (this.simulator.cameraController) {
                    this.simulator.cameraController.setViewMode('top');
                }
            });
        }
        
        const viewFrontBtn = document.getElementById('view-front');
        if (viewFrontBtn) {
            viewFrontBtn.addEventListener('click', () => {
                if (this.simulator.cameraController) {
                    this.simulator.cameraController.setViewMode('front');
                }
            });
        }
        
        const viewSideBtn = document.getElementById('view-side');
        if (viewSideBtn) {
            viewSideBtn.addEventListener('click', () => {
                if (this.simulator.cameraController) {
                    this.simulator.cameraController.setViewMode('side');
                }
            });
        }
        
        const viewFreeBtn = document.getElementById('view-free');
        if (viewFreeBtn) {
            viewFreeBtn.addEventListener('click', () => {
                if (this.simulator.cameraController) {
                    this.simulator.cameraController.setViewMode('free');
                }
            });
        }
        
        const viewFollowBtn = document.getElementById('view-follow');
        if (viewFollowBtn) {
            viewFollowBtn.addEventListener('click', () => {
                if (this.simulator.cameraController) {
                    this.simulator.cameraController.setViewMode('follow');
                }
            });
        }
        
        // Graphics controls
        const qualitySlider = document.getElementById('quality') as HTMLInputElement;
        const showGridCheckbox = document.getElementById('show-grid') as HTMLInputElement;
        const showAxesCheckbox = document.getElementById('show-axes') as HTMLInputElement;
        
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                const value = parseInt((e.target as HTMLInputElement).value);
                const qualities = ['Low', 'Medium', 'High'];
                const valueDisplay = document.getElementById('quality-value');
                if (valueDisplay) valueDisplay.textContent = qualities[value];
                
                // Adjust render quality
                if (this.simulator.engine) {
                    if (value === 0) {
                        this.simulator.engine.setHardwareScalingLevel(2);
                    } else if (value === 1) {
                        this.simulator.engine.setHardwareScalingLevel(1.5);
                    } else {
                        this.simulator.engine.setHardwareScalingLevel(1);
                    }
                }
            });
        }
        
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', (e) => {
                if (this.simulator.scene) {
                    const grid = this.simulator.scene.getMeshByName('grid');
                    if (grid) grid.setEnabled((e.target as HTMLInputElement).checked);
                }
            });
        }
        
        if (showAxesCheckbox) {
            showAxesCheckbox.addEventListener('change', (e) => {
                if (this.simulator.scene) {
                    const axisX = this.simulator.scene.getMeshByName('axisX');
                    const axisY = this.simulator.scene.getMeshByName('axisY');
                    const axisZ = this.simulator.scene.getMeshByName('axisZ');
                    const checked = (e.target as HTMLInputElement).checked;
                    if (axisX) axisX.setEnabled(checked);
                    if (axisY) axisY.setEnabled(checked);
                    if (axisZ) axisZ.setEnabled(checked);
                }
            });
        }
        
        // Simulation controls
        const playPauseBtn = document.getElementById('play-pause');
        const timeScaleSlider = document.getElementById('time-scale') as HTMLInputElement;
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                const isPlaying = this.simulator.togglePlayPause();
                playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
            });
        }
        
        const stepForwardBtn = document.getElementById('step-forward');
        if (stepForwardBtn) {
            stepForwardBtn.addEventListener('click', () => {
                if (!this.simulator.isPlaying) {
                    const delta = 0.016; // One frame
                    if (this.simulator.waterSimulation) {
                        this.simulator.waterSimulation.update(delta);
                    }
                    if (this.simulator.shapeManager) {
                        this.simulator.shapeManager.update(delta);
                    }
                }
            });
        }
        
        if (timeScaleSlider) {
            timeScaleSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                const valueDisplay = document.getElementById('time-scale-value');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(1);
                this.simulator.timeScale = value;
            });
        }
    }
    
    public update(): void {
        // Update FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            const fpsDisplay = document.getElementById('fps');
            if (fpsDisplay) fpsDisplay.textContent = this.fps.toString();
        }
        
        // Update particle count
        const particleCount = this.simulator.waterSimulation ? this.simulator.waterSimulation.getParticleCount() : 0;
        const particleCountDisplay = document.getElementById('particle-count');
        if (particleCountDisplay) particleCountDisplay.textContent = particleCount.toString();
        
        // Update shape count
        const shapeCount = this.simulator.shapeManager ? this.simulator.shapeManager.getShapeCount() : 0;
        const shapeCountDisplay = document.getElementById('shape-count');
        if (shapeCountDisplay) shapeCountDisplay.textContent = shapeCount.toString();
    }
}
