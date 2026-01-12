import { MeshBuilder, StandardMaterial, Color3, Vector3, ActionManager, ExecuteCodeAction, Mesh, ShadowGenerator, Scene } from '@babylonjs/core';
import { WaterSimulation } from './water-simulation';

export class ShapeManager {
    private scene: Scene;
    private waterSimulation: WaterSimulation;
    private shadowGenerator: ShadowGenerator | null;
    private shapes: Mesh[] = [];
    private selectedShape: Mesh | null = null;
    public shapeType: string = 'box';
    public size: number = 1.0;
    
    constructor(scene: Scene, waterSimulation: WaterSimulation, shadowGenerator: ShadowGenerator | null) {
        this.scene = scene;
        this.waterSimulation = waterSimulation;
        this.shadowGenerator = shadowGenerator;
    }
    
    public createShape(type: string, position: Vector3 | null = null, size: number | null = null): Mesh {
        const shapeSize = size || this.size;
        const shapePos = position || new Vector3(
            (Math.random() - 0.5) * 10,
            2,
            (Math.random() - 0.5) * 10
        );
        
        let mesh: Mesh;
        
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
        if ((material as any).metallicFactor !== undefined) {
            (material as any).metallicFactor = 0.3;
        }
        if ((material as any).roughness !== undefined) {
            (material as any).roughness = 0.7;
        }
        
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
    
    public selectShape(shape: Mesh): void {
        this.deselectAll();
        this.selectedShape = shape;
        
        if (shape && shape.material) {
            (shape.material as StandardMaterial).emissiveColor = new Color3(0.29, 0.56, 0.89); // Blue highlight
            shape.userData.originalEmissive = (shape.material as StandardMaterial).emissiveColor.clone();
        }
    }
    
    public deselectAll(): void {
        if (this.selectedShape && this.selectedShape.material) {
            (this.selectedShape.material as StandardMaterial).emissiveColor = new Color3(0, 0, 0);
        }
        this.selectedShape = null;
    }
    
    public deleteShape(shape: Mesh): void {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
            shape.dispose();
            
            if (this.selectedShape === shape) {
                this.selectedShape = null;
            }
        }
    }
    
    public deleteSelected(): void {
        if (this.selectedShape) {
            this.deleteShape(this.selectedShape);
        }
    }
    
    public clearAll(): void {
        while (this.shapes.length > 0) {
            this.deleteShape(this.shapes[0]);
        }
    }
    
    public getAllShapes(): Mesh[] {
        return this.shapes;
    }
    
    public setShapeType(type: string): void {
        this.shapeType = type;
    }
    
    public setSize(size: number): void {
        this.size = size;
    }
    
    public update(delta: number): void {
        // Animate selected shape
        if (this.selectedShape) {
            this.selectedShape.rotation.y += delta * 0.5;
        }
        
        // Update shape interactions with water particles
        // This is handled by the particle system's collision detection
    }
    
    public getShapeCount(): number {
        return this.shapes.length;
    }
}
