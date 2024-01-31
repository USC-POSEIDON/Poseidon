// TLE data mock
var defaultTleLine1 = '1 25544U 98067A   20053.19547778  .00000739  00000-0  21903-4 0  9991',
defaultTleLine2 = '2 25544  51.6415 357.7365 0004954 276.8582  58.3016 15.49238122215825';

var satrec = satellite.twoline2satrec(defaultTleLine1, defaultTleLine2);

 // update tle form user input
 function updateSatelliteTLE() {
    var tleLine1 = document.getElementById('tleLine1').value;
    var tleLine2 = document.getElementById('tleLine2').value;

    if (isValidTLE(tleLine1, tleLine2)) {
        satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        var orbitPath = computeOrbitPath(satrec);
        orbitEntity.polyline.positions = new Cesium.CallbackProperty(function() {
            return computeOrbitPath(satrec);
        }, false);

        satelliteEntity.position = new Cesium.CallbackProperty(function() {
            return updateSatellitePosition();
        }, false);
    } else {
        alert("Invalid TLE data. Please check and try again.");
    }
}

function isValidTLE(line1, line2) {
    if (line1.length !== 69 || line2.length !== 69) {
        return false;
    }
    if (line1.charAt(0) !== '1' || line2.charAt(0) !== '2') {
        return false;
    }
    return true;
}


var satelliteEntity = viewer.entities.add({
    id: 'satellite',
    position: new Cesium.CallbackProperty(updateSatellitePosition, false),
    point: {
        pixelSize: 5,
        color: Cesium.Color.RED
    }
});

// set up the orbit path
var orbitPath = computeOrbitPath(satrec);
var orbitEntity = viewer.entities.add({
    id: 'orbitPath',
    polyline: {
        positions: orbitPath,
        width: 2,
        material: Cesium.Color.YELLOW
    }
});

// update position
function updateSatellitePosition() {
    var now = new Date();
    return getSatellitePosition(now, satrec);
}

//update orbit path
function updateOrbitPath() {
    var newOrbitPath = computeOrbitPath(satrec);
    orbitEntity.polyline.positions = newOrbitPath;
}

setInterval(updateOrbitPath, 50 * 60 * 1000); 

// compute satellite position at a given time
function getSatellitePosition(time, satrec) {
    var positionAndVelocity = satellite.propagate(satrec, time);
    var positionEci = positionAndVelocity.position;

    var gmst = satellite.gstime(time);
    var positionGd = satellite.eciToGeodetic(positionEci, gmst);

    return Cesium.Cartesian3.fromRadians(positionGd.longitude, positionGd.latitude, positionGd.height * 1000);
}

// compute orbit path
function computeOrbitPath(satrec) {
    var positions = [];
    var now = new Date();
    for (var i = 0; i < 90; i++) {
        var time = new Date(now.getTime() + i * 60000); // Compute for next 90 minutes
        var position = getSatellitePosition(time, satrec);
        positions.push(position);
    }
    return positions;
}

//could be optional here
//viewer.trackedEntity = satelliteEntity;

// mock location for the ground station
var groundStationPosition = Cesium.Cartesian3.fromDegrees(-74.0060, 40.7128);

// create the ground station marker
var groundStationEntity = viewer.entities.add({
    id: 'groundStation',
    position: groundStationPosition,
    point: {
        pixelSize: 10,
        color: Cesium.Color.BLUE
    },
    label: {
        text: 'NYC',
        font: '12pt monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -9)
    }
});

function getSatelliteAltitude(position) {
    var earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius; 
    var altitude = Cesium.Cartesian3.magnitude(position) - earthRadius;
    return Math.max(0, altitude);
}


function calculateFootprintRadius(altitude) {
    const earthRadius = 6371; 
    return earthRadius * Math.acos(earthRadius / (earthRadius + altitude));
}

// range circle
var rangeCircleEntity = viewer.entities.add({
    id: 'rangeCircle',
    ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(function() {
            var position = satelliteEntity.position.getValue(viewer.clock.currentTime);
            var altitude = getSatelliteAltitude(position); 
            return calculateFootprintRadius(altitude / 1000) * 1000; 
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(function() {
            var position = satelliteEntity.position.getValue(viewer.clock.currentTime);
            var altitude = getSatelliteAltitude(position); 
            return calculateFootprintRadius(altitude / 1000) * 1000; 
        }, false),
        material: Cesium.Color.BLUE.withAlpha(0.3),
        height: 0 
    }
});

// update the range circle position
rangeCircleEntity.position = new Cesium.CallbackProperty(function() {
    var position = satelliteEntity.position.getValue(viewer.clock.currentTime);
    return Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(position);
}, false);
