import * as THREE from 'three';

export class ShapeManager {
    constructor(scene, waterSimulation) {
        this.scene = scene;
        this.waterSimulation = waterSimulation;
        this.shapes = [];
        this.selectedShape = null;
        this.shapeType = 'box';
        this.size = 1.0;
    }
    
    createShape(type, position = null, size = null) {
        const shapeSize = size || this.size;
        const shapePos = position || new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            2,
            (Math.random() - 0.5) * 10
        );
        
        let geometry;
        let material;
        
        switch (type) {
            case 'box':
                geometry = new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(shapeSize, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(shapeSize, shapeSize, shapeSize * 2, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(shapeSize, shapeSize * 2, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(shapeSize, shapeSize * 0.3, 16, 100);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(shapeSize * 2, shapeSize * 2);
                break;
            case 'pyramid':
                geometry = new THREE.ConeGeometry(shapeSize, shapeSize * 1.5, 4);
                break;
            default:
                geometry = new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize);
        }
        
        material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.3,
            roughness: 0.7,
            emissive: new THREE.Color(0x000000),
            emissiveIntensity: 0
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(shapePos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = type;
        mesh.userData.originalColor = material.color.clone();
        
        // Add wireframe for better visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
        );
        mesh.add(line);
        
        this.shapes.push(mesh);
        this.scene.add(mesh);
        
        return mesh;
    }
    
    selectShape(shape) {
        this.deselectAll();
        this.selectedShape = shape;
        
        if (shape) {
            // Highlight selected shape
            shape.material.emissive.setHex(0x4a90e2);
            shape.material.emissiveIntensity = 0.3;
        }
    }
    
    deselectAll() {
        if (this.selectedShape) {
            this.selectedShape.material.emissive.copy(this.selectedShape.userData.originalColor);
            this.selectedShape.material.emissiveIntensity = 0;
        }
        this.selectedShape = null;
    }
    
    deleteShape(shape) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
            this.scene.remove(shape);
            
            // Clean up geometry and material
            shape.geometry.dispose();
            shape.material.dispose();
            
            if (this.selectedShape === shape) {
                this.selectedShape = null;
            }
        }
    }
    
    deleteSelected() {
        if (this.selectedShape) {
            this.deleteShape(this.selectedShape);
        }
    }
    
    clearAll() {
        while (this.shapes.length > 0) {
            this.deleteShape(this.shapes[0]);
        }
    }
    
    getAllShapes() {
        return this.shapes;
    }
    
    setShapeType(type) {
        this.shapeType = type;
    }
    
    setSize(size) {
        this.size = size;
    }
    
    update(delta) {
        // Update shape interactions with water
        for (const shape of this.shapes) {
            // Animate selected shape slightly
            if (shape === this.selectedShape) {
                shape.rotation.y += delta * 0.5;
            }
            
            // Check collisions with water particles
            if (this.waterSimulation && this.waterSimulation.particleSystem) {
                const positions = this.waterSimulation.particleSystem.geometry.attributes.position.array;
                const velocities = this.waterSimulation.particleSystem.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    const particlePos = new THREE.Vector3(
                        positions[i],
                        positions[i + 1],
                        positions[i + 2]
                    );
                    
                    const collision = this.checkCollision(particlePos, shape);
                    if (collision.collided) {
                        // Reflect particle
                        const normal = collision.normal;
                        const velocity = new THREE.Vector3(
                            velocities[i],
                            velocities[i + 1],
                            velocities[i + 2]
                        );
                        
                        const reflected = velocity.clone().reflect(normal);
                        velocities[i] = reflected.x * 0.8;
                        velocities[i + 1] = reflected.y * 0.8;
                        velocities[i + 2] = reflected.z * 0.8;
                        
                        // Push particle away
                        const pushDistance = 0.1;
                        positions[i] += normal.x * pushDistance;
                        positions[i + 1] += normal.y * pushDistance;
                        positions[i + 2] += normal.z * pushDistance;
                    }
                }
            }
        }
    }
    
    checkCollision(point, shape) {
        const shapePos = shape.position;
        const shapeScale = shape.scale;
        const dist = point.distanceTo(shapePos);
        
        // Get bounding box size
        let size = 1.0;
        if (shape.geometry.type === 'BoxGeometry') {
            size = Math.max(shapeScale.x, shapeScale.y, shapeScale.z);
        } else if (shape.geometry.type === 'SphereGeometry') {
            size = shapeScale.x;
        } else if (shape.geometry.type === 'CylinderGeometry' || shape.geometry.type === 'ConeGeometry') {
            size = Math.max(shapeScale.x, shapeScale.y);
        } else if (shape.geometry.type === 'TorusGeometry') {
            size = shapeScale.x * 1.3;
        } else if (shape.geometry.type === 'PlaneGeometry') {
            size = Math.max(shapeScale.x, shapeScale.y) * 2;
        }
        
        if (dist < size) {
            const normal = point.clone().sub(shapePos).normalize();
            return { collided: true, normal };
        }
        
        return { collided: false };
    }
    
    getShapeCount() {
        return this.shapes.length;
    }
}
