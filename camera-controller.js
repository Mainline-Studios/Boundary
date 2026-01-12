import { Vector3 } from '@babylonjs/core';

export class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.viewMode = 'free';
        this.target = Vector3.Zero();
        this.radius = 20;
        this.theta = Math.PI / 4;
        this.phi = Math.PI / 3;
        this.followTarget = null;
        this.lerpSpeed = 0.1;
    }
    
    setViewMode(mode) {
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
    
    update(delta) {
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
    
    setFollowTarget(target) {
        this.followTarget = target;
    }
}
