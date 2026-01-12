import * as THREE from 'three';

export class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.viewMode = 'free';
        this.target = new THREE.Vector3(0, 0, 0);
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
                this.camera.position.set(0, 30, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'front':
                this.camera.position.set(0, 10, 25);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'side':
                this.camera.position.set(25, 10, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'free':
                this.camera.position.set(15, 15, 15);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'follow':
                // Will follow water center
                this.followTarget = new THREE.Vector3(0, 5, 0);
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
            
            const targetPos = new THREE.Vector3(x, y, z);
            this.camera.position.lerp(targetPos, this.lerpSpeed);
            this.camera.lookAt(this.followTarget);
        } else if (this.viewMode === 'free') {
            // Allow manual control (can be extended with orbit controls)
            // For now, just maintain position
        }
    }
    
    setFollowTarget(target) {
        this.followTarget = target;
    }
}
