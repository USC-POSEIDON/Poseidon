# Poseidon Satellite Mission Control Software

This desktop application is built with Electron and integrates various functionalities to track and visualize satellite orbits using Cesium, a powerful library for 3D globes and maps. The app provides a real-time 3D visualization of satellite orbits with the ability to input Two-Line Element set (TLE) data for accurate tracking. It includes a chat window for command input, a calendar for scheduling, and additional modules for motor control and signal processing that are under development.

## Features

- **3D Orbit Visualization**: Real-time satellite orbit visualization with Cesium.
- **TLE Data Input**: Input box for TLE data with validation functionality.
- **Command Input**: Chat window for command input (backend development in progress).
- **Calendar**: Calendar window for scheduling (waiting for backend integration).
- **Motor Control**: Motor control interface (update pending).
- **Signal Processing**: Signal window for signal-related functionalities (update pending).

## Running the Program

Ensure Node.js and npm are installed on your system. Open a terminal or command prompt, navigate to the app's directory, and run:

```bash
npm install # Install dependencies
npm start # Start the application
```

## Packaging the Application
For packaging the application, electron-builder is preferred. It can easily package and build a ready-for-distribution Electron app for macOS, Windows, and Linux.

First, install electron-builder as a dev dependency:
```bash
npm install electron-builder --save-dev
```

Then, run:

```bash
# For your current platform
npm run build

# For a specific platform
npm run build --mac
npm run build --win
npm run build --linux
```

