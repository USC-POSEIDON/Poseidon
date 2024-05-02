# Poseidon Satellite Mission Control Software (V. 0.5.0)

This desktop application is built with Electron and integrates various functionalities to track and visualize satellite orbits using Cesium, a powerful library for 3D globes and maps. The app provides a real-time 3D visualization of satellite orbits with the ability to input Two-Line Element set (TLE) data for accurate tracking. It includes a chat window for command input, a calendar for scheduling, and additional modules for motor control and signal processing that are under development. (See the latest commit for the most up-to-date source code)

![Current Software](https://i.ibb.co/JkmhpXK/Screenshot-2024-04-23-at-10-26-52-AM.png)


## Features

- **3D Orbit Visualization**: Real-time satellite orbit visualization with Cesium.
- **Telemetry Data Calculation And Visualization**: Real-time telemetry data update for corresponding TLE/satellite input
- **TLE Data Input**: Input box for TLE data with validation functionality.
- **Command Input**: Chat window for command input and generation.
- **Calendar**: Calendar window for scheduling (waiting for backend integration).
- **Motor Control**: Motor control interface (update pending).
- **Signal Processing**: Signal window for signal-related functionalities (update pending).

## User Manual 
[USER MANUAL](https://github.com/USC-POSEIDON/Poseidon/blob/main/POSEIDON%20User%20Manual.pdf)

## Running the Program 
Choose the latest release from this repository and install

## Running the Program (Developers)

Ensure Node.js and npm are installed on your system. Open a terminal or command prompt, navigate to the app's directory, and run:

```bash
npm install # Install dependencies
cd backend # Get into the backend dir

```

```bash
# Install all the requirements to local env
pip install flask sgp4 scipy requests skyfield waitress setuptools
/path/to/your/desired/python3 -m pip install -e .

# Option 2: create a virtual env 
# ---for windows--- #
py -3.9 -m venv <venv-name> 
.\<venv-name>\Scripts\activate 
pip install flask sgp4 scipy requests skyfield waitress setuptools tzdata pyinstaller
pip install -e . 

# ---for linux and mac--- #
python3 -m venv venv 
source venv/bin/activate
pip install flask sgp4 scipy requests skyfield waitress setuptools
pip install -e . 


npm start # Start the application
```

**Note for error "“run” can’t be opened because Apple cannot check it for malicious software."
Right-click (or control-click) on the backend/dist/run executable in Finder, and select Open from the context menu. This action brings up a dialog with an option to open the app anyway. This method only needs to be done once, as macOS will remember your choice for this app in the future. 

**Note: Python vers. 3.9 required. Some packages aren't supported in later versions.

## Packaging the Application
For packaging the application, electron-builder is preferred. It can easily package and build a ready-for-distribution Electron app for macOS, Windows, and Linux.

First, package the python environment:

```bash
cd backend
./<venv-name>/Scripts/activate 
python setup.py sdist
pip install dist/tle_calculations-0.0.0.tar.gz

# For windows only:
pyinstaller --onedir --add-data "tle_calculations;tle_calculations" --add-data "./<venv-name>/Lib/site-packages/waitress;waitress" tle_calculations/run.py

# For mac only:
pyinstaller run.spec
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


