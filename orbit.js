// TLE data mock
var tleLine1 = '1 25544U 98067A   20053.19547778  .00000739  00000-0  21903-4 0  9991',
    tleLine2 = '2 25544  51.6415 357.7365 0004954 276.8582  58.3016 15.49238122215825';

var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

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