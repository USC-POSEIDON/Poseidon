var TleLine1 = '';
var TleLine2 = '';

// Initialize satellite record from default TLE
var satrec;
if (TleLine1 !== '' && TleLine2 !== '') {
    satrec = satellite.twoline2satrec(TleLine1, TleLine2);
}

// Satellite and Orbit Path Entities
var satelliteEntity, orbitEntity;

// Initialization function
function initializeViewer() {
    if (satrec) {
        satelliteEntity = viewer.entities.add({
            id: 'satellite',
            position: new Cesium.CallbackProperty(updateSatellitePosition, false),
            point: {
                pixelSize: 5,
                color: Cesium.Color.RED
            }
        });

        createOrUpdateOrbitPath(satrec);
    }
    
    // Ground Station Entity
    var groundStationPosition = Cesium.Cartesian3.fromDegrees(0, 0);

    document.getElementById('updatePosition').addEventListener('click', function() {
        var latitude = parseFloat(document.getElementById('latitude').value);
        var longitude = parseFloat(document.getElementById('longitude').value);
        var latDirection = document.getElementById('lat-direction').value;
        var longDirection = document.getElementById('long-direction').value;
        document.getElementById('latitude-error').textContent = '';
        document.getElementById('longitude-error').textContent = '';
        // Validate the latitude and longitude values
        if (latitude < -90 || latitude > 90 || isNaN(latitude)) {
            document.getElementById('latitude-error').textContent = 'Invalid latitude value';
            return; 
        }
        if (longitude < -180 || longitude > 180 || isNaN(longitude)) {
            document.getElementById('longitude-error').textContent = 'Invalid longitude value';
            return; 
        }

        // Adjust the latitude and longitude based on the hemisphere
        latitude *= (latDirection === 'N') ? 1 : -1;
        longitude *= (longDirection === 'E') ? 1 : -1;
        groundStationPosition = {latitude: latitude, longitude: longitude};
         // Convert latitude and longitude to Cesium Cartesian3 coordinates
         var newGroundStationPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude);
    
         // Update the entity's position
         var groundStationEntity = viewer.entities.getById('groundStation');
         if (groundStationEntity) {
             groundStationEntity.position = newGroundStationPosition;
             document.getElementById('GSLocText').textContent = 'GS: ' + latitude + '°, ' + longitude + '°';
             console.log('Ground Station position updated to:', latitude, longitude);
         } else {
             console.log('Ground Station entity not found.');
         }
     
        console.log('Updated groundStationPosition:', groundStationPosition, updateGroundStationBackEnd(latitude, longitude), predictPasses());
        document.getElementById('groundStationModal').style.display = "none";
    });
      
    document.getElementById('closeModal').addEventListener('click', function() {
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

    function updateGroundStation(lat, lon){
        // TODO: use one function for ground station onClick and init?
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        const latitudeElement = document.getElementById('latitude');
        const longitudeElement = document.getElementById('longitude');
        const latDirection = document.getElementById('lat-direction');
        const longDirection = document.getElementById('long-direction');

        // Adjust the hemisphere based on the latitude and longitude
        latitudeElement.value = Math.abs(latitude);
        longitudeElement.value = Math.abs(longitude); 
        latDirection.value = (latitude >= 0) ? 'N' : 'S';
        longDirection.value = (longitude >= 0) ? 'E' : 'W';
        groundStationPosition = {latitude: latitude, longitude: longitude};
    
        // Convert latitude and longitude to Cesium Cartesian3 coordinates
        var newGroundStationPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude);
    
        // Update the entity's position
        var groundStationEntity = viewer.entities.getById('groundStation');
        if (groundStationEntity) {
            groundStationEntity.position = newGroundStationPosition;
            document.getElementById('GSLocText').textContent = 'GS: ' + latitude + '°, ' + longitude + '°';
            console.log('Ground Station position initialized to:', latitude, longitude);
        } else {
            console.log('Ground Station entity not found.');
        }   
    }

    document.addEventListener('DOMContentLoaded', function() {
        fetch(`http://127.0.0.1:5000/calculations/get/groundstation`)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("HTTP error, status = " + response.status);
            }
            return response.json();
        })
        .then(function (responseData) {
            console.log(responseData);  // Log the response data
            const data = JSON.parse(JSON.stringify(responseData));
            const lat = data.lat;
            const lon = data.lon; 
            updateGroundStation(lat, lon);
        })
        .catch(function (error) {
            // if server is up, should never get here
            console.log(error);
            updateGroundStation(34.0208, -118.2910); 
        }); 
    });
}

// Function to update satellite TLE from user input
function updateSatelliteTLE(tleLine1, tleLine2) {
    if (isValidTLE(tleLine1, tleLine2)) {
        satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        createOrUpdateOrbitPath(satrec); // Use the new function here
        if (!satelliteEntity) {
            satelliteEntity = viewer.entities.add({
                id: 'satellite',
                position: new Cesium.CallbackProperty(function() {
                    return updateSatellitePosition();
                }, false),
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED
                }
            });
        } else {
            satelliteEntity.position = new Cesium.CallbackProperty(function() {
                return updateSatellitePosition();
            }, false);
        }
    } else {
        alert("Invalid TLE data. Please check and try again.");
    }
}


function createOrUpdateOrbitPath(satrec) {
    var orbitPath = computeOrbitPath(satrec);
    if (orbitEntity) {
        // Update existing orbit path
        orbitEntity.polyline.positions = orbitPath;
    } else {
        // Create new orbit entity if it doesn't exist
        orbitEntity = viewer.entities.add({
            id: 'orbitPath',
            polyline: {
                positions: orbitPath,
                width: 2,
                material: Cesium.Color.YELLOW
            }
        });

        // Create new range circle entity if it doesn't exist
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
}


// Function to validate TLE format
function isValidTLE(line1, line2) {
    console.log("Is TLE valid?");
    console.log(line1);
    console.log(line2);
    if(line1.length !== 69){
        console.log("line 1 len error");
    }
    if(line2.length !== 69){
        console.log("line 2 len error");
    }
    if(line1.charAt(0) !== '1'){
        console.log("line 1 char error");
    }
    if(line2.charAt(0) !== '2'){
        console.log("line 2 char error");
    }

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
    if(!satrec) return;
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


