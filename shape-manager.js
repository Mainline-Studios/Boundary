import { MeshBuilder, StandardMaterial, Color3, Vector3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';

export class ShapeManager {
    constructor(scene, waterSimulation, shadowGenerator) {
        this.scene = scene;
        this.waterSimulation = waterSimulation;
        this.shadowGenerator = shadowGenerator;
        this.shapes = [];
        this.selectedShape = null;
        this.shapeType = 'box';
        this.size = 1.0;
    }
    
    createShape(type, position = null, size = null) {
        const shapeSize = size || this.size;
        const shapePos = position || new Vector3(
            (Math.random() - 0.5) * 10,
            2,
            (Math.random() - 0.5) * 10
        );
        
        let mesh;
        
        switch (type) {
            case 'box':
                mesh = MeshBuilder.CreateBox('shape', { size: shapeSize }, this.scene);
                break;
            case 'sphere':
                mesh = MeshBuilder.CreateSphere('shape', { diameter: shapeSize * 2, segments: 32 }, this.scene);
                break;
            case 'cylinder':
                mesh = MeshBuilder.CreateCylinder('shape', { diameter: shapeSize * 2, height: shapeSize * 2, tessellation: 32 }, this.scene);
                break;
            case 'cone':
                mesh = MeshBuilder.CreateCylinder('shape', { diameterTop: 0, diameterBottom: shapeSize * 2, height: shapeSize * 2, tessellation: 32 }, this.scene);
                break;
            case 'torus':
                mesh = MeshBuilder.CreateTorus('shape', { diameter: shapeSize * 2, thickness: shapeSize * 0.3, tessellation: 32 }, this.scene);
                break;
            case 'plane':
                mesh = MeshBuilder.CreatePlane('shape', { size: shapeSize * 2 }, this.scene);
                break;
            case 'pyramid':
                mesh = MeshBuilder.CreatePolyhedron('shape', { type: 1, size: shapeSize }, this.scene);
                break;
            default:
                mesh = MeshBuilder.CreateBox('shape', { size: shapeSize }, this.scene);
        }
        
        const material = new StandardMaterial('shapeMaterial', this.scene);
        material.diffuseColor = new Color3(0.5, 0.5, 0.5);
        material.specularColor = new Color3(0.3, 0.3, 0.3);
        material.emissiveColor = new Color3(0, 0, 0);
        material.metallicFactor = 0.3;
        material.roughness = 0.7;
        
        mesh.material = material;
        mesh.position.copyFrom(shapePos);
        mesh.receiveShadows = true;
        
        if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(mesh);
        }
        
        mesh.userData = {
            type: type,
            originalEmissive: new Color3(0, 0, 0),
            isShape: true
        };
        
        // Add click action
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.selectShape(mesh);
            })
        );
        
        this.shapes.push(mesh);
        
        return mesh;
    }
    
    selectShape(shape) {
        this.deselectAll();
        this.selectedShape = shape;
        
        if (shape && shape.material) {
            shape.material.emissiveColor = new Color3(0.29, 0.56, 0.89); // Blue highlight
            shape.userData.originalEmissive = shape.material.emissiveColor.clone();
        }
    }
    
    deselectAll() {
        if (this.selectedShape && this.selectedShape.material) {
            this.selectedShape.material.emissiveColor = new Color3(0, 0, 0);
        }
        this.selectedShape = null;
    }
    
    deleteShape(shape) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
            shape.dispose();
            
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
        // Animate selected shape
        if (this.selectedShape) {
            this.selectedShape.rotation.y += delta * 0.5;
        }
        
        // Update shape interactions with water particles
        // This is handled by the particle system's collision detection
    }
    
    getShapeCount() {
        return this.shapes.length;
    }
}
