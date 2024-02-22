// TODO: Mock Data Here
var defaultTleLine1 = '1 25544U 98067A   20053.19547778  .00000739  00000-0  21903-4 0  9991';
var defaultTleLine2 = '2 25544  51.6415 357.7365 0004954 276.8582  58.3016 15.49238122215825';


// Initialize satellite record from default TLE
var satrec = satellite.twoline2satrec(defaultTleLine1, defaultTleLine2);

// Satellite and Orbit Path Entities
var satelliteEntity, orbitEntity;

// Initialization function
function initializeViewer() {
    satelliteEntity = viewer.entities.add({
        id: 'satellite',
        position: new Cesium.CallbackProperty(updateSatellitePosition, false),
        point: {
            pixelSize: 5,
            color: Cesium.Color.RED
        }
    });

    var orbitPath = computeOrbitPath(satrec);
    orbitEntity = viewer.entities.add({
        id: 'orbitPath',
        polyline: {
            positions: orbitPath,
            width: 2,
            material: Cesium.Color.YELLOW
        }
    });
    
    // Ground Station Entity
    //TODO: Mock Data Here
    var groundStationPosition = Cesium.Cartesian3.fromDegrees(-74.0060, 40.7128);

    document.getElementById('updatePosition').addEventListener('click', function() {
        var latitude = document.getElementById('latitude').value;
        var longitude = document.getElementById('longitude').value;
        groundStationPosition = {latitude: latitude, longitude: longitude};
        console.log('Updated groundStationPosition:', groundStationPosition);
        document.getElementById('groundStationModal').style.display = "none";
      });
      
      document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('groundStationModal').style.display = "none";
      });

      document.getElementById('updatePosition').addEventListener('click', function() {
        var latitude = parseFloat(document.getElementById('latitude').value);
        var longitude = parseFloat(document.getElementById('longitude').value);
    
        // Convert latitude and longitude to Cesium Cartesian3 coordinates
        var newGroundStationPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude);
    
        // Update the entity's position
        var groundStationEntity = viewer.entities.getById('groundStation');
        if (groundStationEntity) {
            groundStationEntity.position = newGroundStationPosition;
            console.log('Ground Station position updated to:', latitude, longitude);
        } else {
            console.log('Ground Station entity not found.');
        }
    
        // Close the modal
        document.getElementById('groundStationModal').style.display = "none";
    });

    viewer.entities.add({
        id: 'groundStation',
        position: groundStationPosition,
        point: {
            pixelSize: 10,
            color: Cesium.Color.BLUE
        },
        label: {
            text: 'GS',
            font: '12pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    });

    // Range Circle Entity
    viewer.entities.add({
        id: 'rangeCircle',
        position: new Cesium.CallbackProperty(function() {
            var position = satelliteEntity.position.getValue(viewer.clock.currentTime);
            return Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(position);
        }, false),
        ellipse: {
            semiMajorAxis: new Cesium.CallbackProperty(function() {
                var altitude = getSatelliteAltitude(satelliteEntity.position.getValue(viewer.clock.currentTime));
                return calculateFootprintRadius(altitude / 1000) * 1000;
            }, false),
            semiMinorAxis: new Cesium.CallbackProperty(function() {
                var altitude = getSatelliteAltitude(satelliteEntity.position.getValue(viewer.clock.currentTime));
                return calculateFootprintRadius(altitude / 1000) * 1000;
            }, false),
            material: Cesium.Color.BLUE.withAlpha(0.3),
            height: 0
        }
    });
}

// Function to update satellite TLE from user input
function updateSatelliteTLE() {
    var tleLine1 = document.getElementById('tleLine1').value;
    var tleLine2 = document.getElementById('tleLine2').value;

    if (isValidTLE(tleLine1, tleLine2)) {
        satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        orbitEntity.polyline.positions = computeOrbitPath(satrec);
        satelliteEntity.position = new Cesium.CallbackProperty(function() {
            return updateSatellitePosition();
        }, false);
    } else {
        alert("Invalid TLE data. Please check and try again.");
    }
}

// Function to validate TLE format
function isValidTLE(line1, line2) {
    return line1.length === 69 && line2.length === 69 && line1.charAt(0) === '1' && line2.charAt(0) === '2';
}

// Function to update satellite position
function updateSatellitePosition() {
    var now = new Date();
    return getSatellitePosition(now, satrec);
}

// Function to compute satellite position at a given time
function getSatellitePosition(time, satrec) {
    var positionAndVelocity = satellite.propagate(satrec, time);
    var positionEci = positionAndVelocity.position;
    var gmst = satellite.gstime(time);
    var positionGd = satellite.eciToGeodetic(positionEci, gmst);
    return Cesium.Cartesian3.fromRadians(positionGd.longitude, positionGd.latitude, positionGd.height * 1000);
}

// Function to compute orbit path
function computeOrbitPath(satrec, fractionOfOrbit = 1) {
    var orbitalPeriodMinutes = calculateOrbitalPeriodFromSatrec(satrec);
    var orbitalPeriodSeconds = orbitalPeriodMinutes * 60; 
    var interval = 15; 
    var numberOfSegments = (orbitalPeriodSeconds * fractionOfOrbit) / interval;
    var positions = [];
    var now = new Date();

    for (var i = 0; i <= numberOfSegments; i++) {
        var time = new Date(now.getTime() + i * interval * 1000); 
        var position = getSatellitePosition(time, satrec);
        positions.push(position);
    }

    return positions;
}

// Function to update the orbit and satellite position for each orbital period
function startOrbitUpdatesPerOrbitalPeriod(satrec) {
    var orbitalPeriodMinutes = calculateOrbitalPeriodFromSatrec(satrec);
    var updateIntervalMilliseconds = orbitalPeriodMinutes * 60 * 1000; 
    setInterval(function() {
        var newOrbitPath = computeOrbitPath(satrec);
        orbitEntity.polyline.positions = newOrbitPath;
        satelliteEntity.position = new Cesium.CallbackProperty(function() {
            return updateSatellitePosition(satrec); 
        }, false);
    }, updateIntervalMilliseconds);
}

// Function to calculate orbital period from satellite record
function calculateOrbitalPeriodFromSatrec(satrec) {
    var meanMotionRevPerDay = satrec.no * 1440 / (2 * Math.PI); 
    var orbitalPeriodMinutes = 1440 / meanMotionRevPerDay; 
    return orbitalPeriodMinutes;
}

// Function to get satellite altitude
function getSatelliteAltitude(position) {
    var earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius; 
    var altitude = Cesium.Cartesian3.magnitude(position) - earthRadius;
    return Math.max(0, altitude);
}

// Function to calculate footprint radius
function calculateFootprintRadius(altitude) {
    const earthRadius = 6371; 
    return earthRadius * Math.acos(earthRadius / (earthRadius + altitude)); 
}

initializeViewer(); 
startOrbitUpdatesPerOrbitalPeriod(satrec);


