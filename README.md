# Poseidon Satellite Mission Control Software (V. 0.2.5)

This desktop application is built with Electron and integrates various functionalities to track and visualize satellite orbits using Cesium, a powerful library for 3D globes and maps. The app provides a real-time 3D visualization of satellite orbits with the ability to input Two-Line Element set (TLE) data for accurate tracking. It includes a chat window for command input, a calendar for scheduling, and additional modules for motor control and signal processing that are under development. (See the lastest commit for the most up to date source code)

![Current Software](https://cdn.discordapp.com/attachments/1198491340808388739/1202087224498196530/Screenshot_2024-01-30_at_7.05.13_PM.png?ex=65cc2df8&is=65b9b8f8&hm=350ac5ceb8570d9cafeaf7245434f9f325e546bdc071c066ba9381d1e472df79&)



## Features

- **3D Orbit Visualization**: Real-time satellite orbit visualization with Cesium.
- **Telemetry Data Calculation And Visualization: Real-time telemetry data update for corresponding TLE/satellite input
- **TLE Data Input**: Input box for TLE data with validation functionality.
- **Command Input**: Chat window for command input (backend development in progress).
- **Calendar**: Calendar window for scheduling (waiting for backend integration).
- **Motor Control**: Motor control interface (update pending).
- **Signal Processing**: Signal window for signal-related functionalities (update pending).

## Running the Program

Ensure Node.js and npm are installed on your system. Open a terminal or command prompt, navigate to the app's directory, and run:

```bash
npm install # Install dependencies
cd backend # Get into the backend dir
pip install -e . # Install necessary python package
npm start # Start the application
```

**Note for error "“run” can’t be opened because Apple cannot check it for malicious software."
Right-click (or control-click) on the backend/dist/run executable in Finder, and select Open from the context menu. This action brings up a dialog with an option to open the app anyway. This method only needs to be done once, as macOS will remember your choice for this app in the future.

## Packaging the Application
For packaging the application, electron-builder is preferred. It can easily package and build a ready-for-distribution Electron app for macOS, Windows, and Linux.

First, package the python environment:

```bash
cd backend
python setup.py sdist
python3 -m venv myenv
source myenv/bin/activate  # On Windows use `myenv\Scripts\activate`
pip install dist/tle_calculations-<version>.tar.gz
pip install flask sgp4 scipy requests skyfield
pyinstaller --onefile --add-data 'tle_calculations:tle_calculations' tle_calculations/run.py
```

Second, install electron-builder as a dev dependency:
```bash
npm install electron-builder --save-dev
```

Then, run:

```bash
# For your current platform
npm run dist

# For a specific platform
npm run dist --mac
npm run dist --win
npm run dist --linux
```


