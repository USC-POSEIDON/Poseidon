# Poseidon Satellite Mission Control Software (V. 0.1.5)

This desktop application is built with Electron and integrates various functionalities to track and visualize satellite orbits using Cesium, a powerful library for 3D globes and maps. The app provides a real-time 3D visualization of satellite orbits with the ability to input Two-Line Element set (TLE) data for accurate tracking. It includes a chat window for command input, a calendar for scheduling, and additional modules for motor control and signal processing that are under development. (See the lastest commit for the most up to date source code)

![Current Software](https://cdn.discordapp.com/attachments/1198491340808388739/1202087224498196530/Screenshot_2024-01-30_at_7.05.13_PM.png?ex=65cc2df8&is=65b9b8f8&hm=350ac5ceb8570d9cafeaf7245434f9f325e546bdc071c066ba9381d1e472df79&)



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

