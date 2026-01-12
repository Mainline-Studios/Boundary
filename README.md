# Boundary - Realistic Water Simulator

A beautiful, interactive 3D water simulation built with Three.js featuring realistic physics, customizable obstacles, and multiple camera views.

![Water Simulator](https://img.shields.io/badge/Three.js-0.160.0-000000?logo=three.js)
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## Features

### 🌊 Realistic Water Simulation
- **Particle-based physics** with gravity, viscosity, and collision detection
- **Dynamic water surface** with animated waves and realistic shaders
- **Customizable water properties**: level, wave speed, viscosity, and gravity
- **Beautiful water rendering** with reflections, refractions, and foam effects
- **Adjustable water color** for different visual styles

### 🎨 Interactive Obstacles & Walls
- **Multiple shape types**: Box, Sphere, Cylinder, Cone, Torus, Plane (Wall), Pyramid
- **Editable shapes**: Click to select, adjust size, and delete
- **Real-time collision** with water particles
- **Visual feedback** with highlighted selected objects
- **Easy management**: Add, delete, or clear all shapes

### 📷 Multiple Camera Views
- **Top View**: Bird's eye perspective
- **Front View**: Direct frontal view
- **Side View**: Side perspective
- **Free Camera**: Manual control
- **Follow Mode**: Dynamic orbiting camera

### 🎛️ User-Friendly Controls
- **Intuitive UI panel** with organized sections
- **Real-time parameter adjustment** with sliders
- **Play/Pause simulation** with step-forward option
- **Time scale control** for slow-motion or fast-forward
- **Graphics quality settings** (Low/Medium/High)
- **Grid and axes toggles** for better visualization

### 📊 Performance Monitoring
- **Real-time FPS counter**
- **Particle count display**
- **Shape count display**

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boundary-water-simulator.git
cd boundary-water-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Basic Controls

1. **Add Water**: Click the "Add Water" button to spawn more water particles
2. **Add Shapes**: Select a shape type, adjust the size, and click "Add Shape"
3. **Select Shapes**: Click on any shape in the scene to select it (it will glow blue)
4. **Delete Shapes**: Select a shape and click "Delete Selected", or use "Clear All"
5. **Change Views**: Use the camera view buttons to switch perspectives
6. **Adjust Water**: Use the sliders to modify water properties in real-time

### Tips

- **Experiment with viscosity**: Lower values create more fluid water, higher values create thicker, slower water
- **Adjust gravity**: Lower gravity creates slower falling water, higher creates faster
- **Use walls**: Add Plane shapes to create walls that water can collide with
- **Multiple shapes**: Create complex obstacle courses by combining different shapes
- **Quality settings**: Lower quality for better performance on slower devices

## Technical Details

### Technologies Used
- **Three.js**: 3D graphics and WebGL rendering
- **Vite**: Build tool and development server
- **WebGL Shaders**: Custom water surface shaders for realistic rendering

### Architecture
- **Modular design**: Separate classes for water simulation, shape management, camera control, and UI
- **Efficient rendering**: Optimized particle systems and shader-based water surface
- **Physics simulation**: Real-time particle physics with collision detection

### Performance
- Optimized for 60 FPS on modern hardware
- Adjustable quality settings for different performance targets
- Efficient particle system with configurable particle count

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with WebGL support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Inspired by fluid dynamics and water simulation research

## Future Enhancements

Potential features for future versions:
- [ ] More advanced physics engine integration
- [ ] Save/load scene configurations
- [ ] More shape types and customization options
- [ ] Advanced water effects (splashes, foam, bubbles)
- [ ] VR support
- [ ] Multiplayer mode
- [ ] Export animations/videos

---

Enjoy creating beautiful water simulations! 🌊
