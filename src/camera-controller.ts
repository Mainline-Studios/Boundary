import { Vector3, ArcRotateCamera, Scene } from '@babylonjs/core';

export class CameraController {
    private camera: ArcRotateCamera;
    private scene: Scene;
    private viewMode: string = 'free';
    private target: Vector3 = Vector3.Zero();
    private radius: number = 20;
    private theta: number = Math.PI / 4;
    private phi: number = Math.PI / 3;
    private followTarget: Vector3 | null = null;
    private lerpSpeed: number = 0.1;
    
    constructor(camera: ArcRotateCamera, scene: Scene) {
        this.camera = camera;
        this.scene = scene;
    }
    
    public setViewMode(mode: string): void {
        this.viewMode = mode;
        
        switch (mode) {
            case 'top':
                this.camera.setTarget(Vector3.Zero());
                this.camera.alpha = 0;
                this.camera.beta = Math.PI / 2;
                this.camera.radius = 30;
                break;
            case 'front':
                this.camera.setTarget(Vector3.Zero());
                this.camera.alpha = 0;
                this.camera.beta = Math.PI / 3;
                this.camera.radius = 25;
                break;
            case 'side':
                this.camera.setTarget(Vector3.Zero());
                this.camera.alpha = Math.PI / 2;
                this.camera.beta = Math.PI / 3;
                this.camera.radius = 25;
                break;
            case 'free':
                this.camera.setTarget(Vector3.Zero());
                this.camera.alpha = -Math.PI / 2;
                this.camera.beta = Math.PI / 3;
                this.camera.radius = 20;
                break;
            case 'follow':
                this.followTarget = new Vector3(0, 5, 0);
                this.theta = Math.PI / 4;
                break;
        }
    }
    
    public update(delta: number): void {
        if (this.viewMode === 'follow' && this.followTarget) {
            // Orbit around water center
            this.theta += delta * 0.2;
            const x = Math.sin(this.theta) * this.radius;
            const z = Math.cos(this.theta) * this.radius;
            const y = 10 + Math.sin(this.theta * 0.5) * 5;
            
            this.camera.setTarget(this.followTarget);
            this.camera.alpha = this.theta;
            this.camera.beta = Math.PI / 3 + Math.sin(this.theta * 0.5) * 0.2;
            this.camera.radius = this.radius;
        }
    }
    
    public setFollowTarget(target: Vector3): void {
        this.followTarget = target;
    }
}
