function updateTelemetryData() {

    fetch(`http://127.0.0.1:5000//satellites/telemetry?`+ new URLSearchParams({
        s: 'value',
        t: 2,
        uplink: 145,
        downlink: 437.5
    }))
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Handle the response data here
        console.log(responseData);
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });


    document.getElementById('azimuth').textContent = azimuth.toFixed(2) + '°';
    document.getElementById('elevation').textContent = elevation.toFixed(2) + '°';
    document.getElementById('slantRange').textContent = (lookAngles.range * 0.001).toFixed(2) + ' km';
    document.getElementById('rangeRate').textContent = rangeRate.toFixed(2) + ' m/s';
    document.getElementById('altitude').textContent = altitude.toFixed(2) + ' km';
    document.getElementById('footprint').textContent = footprint.toFixed(2) + ' km';
    document.getElementById('velocity').textContent = velocity.toFixed(2) + ' km/s';
    document.getElementById('doppler').textContent = doppler.toFixed(2) + ' Hz';
    // var now = new Date();

    // var groundStationEntity = viewer.entities.getById('groundStation');
    // var groundStationCartographic = Cesium.Cartographic.fromCartesian(groundStationEntity.position.getValue(now));
    // var groundStationPosition = {
    //     latitude: Cesium.Math.toDegrees(groundStationCartographic.latitude),
    //     longitude: Cesium.Math.toDegrees(groundStationCartographic.longitude),
    //     height: groundStationCartographic.height
    // };

    // var positionAndVelocity = satellite.propagate(satrec, now);
    // var positionEci = positionAndVelocity.position;
    // var velocityEci = positionAndVelocity.velocity;
    // var gmst = satellite.gstime(now);

    // if (positionEci && positionEci.x !== undefined && positionEci.y !== undefined && positionEci.z !== undefined) {
    //     var observerGd = {
    //         longitude: satellite.degreesToRadians(groundStationPosition.longitude),
    //         latitude: satellite.degreesToRadians(groundStationPosition.latitude),
    //         height: groundStationPosition.height
    //     };

    //     var positionEcf = satellite.eciToEcf(positionEci, gmst);
    //     var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    //     var altitude = calculateAltitude(positionEci);
    //     var footprint = calculateFootprint(altitude);
    //     var velocity = calculateVelocity(velocityEci);

    //     if (lookAngles && lookAngles.azimuth !== undefined && lookAngles.elevation !== undefined) {
    //         var azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
    //         var elevation = satellite.radiansToDegrees(lookAngles.elevation);

    //         var observerEcf = satellite.geodeticToEcf(observerGd);
    //         var rangeRate = calculateRangeRate(observerEcf, positionEci, velocityEci, gmst);

    //         //TODO: Mock Data Here
    //         var frequency = 437.5;
    //         var doppler = calculateDoppler(frequency, rangeRate);

    //         document.getElementById('azimuth').textContent = azimuth.toFixed(2) + '°';
    //         document.getElementById('elevation').textContent = elevation.toFixed(2) + '°';
    //         document.getElementById('slantRange').textContent = (lookAngles.range * 0.001).toFixed(2) + ' km';
    //         document.getElementById('rangeRate').textContent = rangeRate.toFixed(2) + ' m/s';
    //         document.getElementById('altitude').textContent = altitude.toFixed(2) + ' km';
    //         document.getElementById('footprint').textContent = footprint.toFixed(2) + ' km';
    //         document.getElementById('velocity').textContent = velocity.toFixed(2) + ' km/s';
    //         document.getElementById('doppler').textContent = doppler.toFixed(2) + ' Hz';
    //     } else {
    //         console.error('Look angles are undefined.');
    //     }
    // } else {
    //     console.error('PositionEci is undefined.');
    // }
}

function calculateAzEl(positionEci, observerGd, gmst) {
    var positionEcf = satellite.eciToEcf(positionEci, gmst);
    var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    return lookAngles;
  }

function calculateAltitude(positionEci) {
    var earthRadius = 6371.0; 
    var altitude = Math.sqrt(
        Math.pow(positionEci.x, 2) +
        Math.pow(positionEci.y, 2) +
        Math.pow(positionEci.z, 2)
    ) - earthRadius;
    return altitude; 
}

function calculateFootprint(altitude) {
    var earthRadius = 6371.0; 
    var footprintRadius = Math.sqrt(Math.pow(earthRadius + altitude, 2) - Math.pow(earthRadius, 2));
    return footprintRadius; 
}


function calculateVelocity(velocityEci) {
    return Math.sqrt(
        Math.pow(velocityEci.x, 2) +
        Math.pow(velocityEci.y, 2) +
        Math.pow(velocityEci.z, 2)
    ); 
}

function calculateDoppler(frequency, rangeRate) {
    var speedOfLight = 299792.458; 
    var dopplerShift = -(frequency * (rangeRate / speedOfLight));
    return dopplerShift; 
}

function calculateRangeRate(observerEcf, positionEci, velocityEci, gmst) {
    var positionEcf = satellite.eciToEcf(positionEci, gmst);

    var observerVelocityEcf = {
        x: 0,
        y: 0,
        z: 0
    };

    var relativeVelocityEcf = {
        x: velocityEci.x - observerVelocityEcf.x,
        y: velocityEci.y - observerVelocityEcf.y,
        z: velocityEci.z - observerVelocityEcf.z
    };

    var rangeEcf = {
        x: positionEcf.x - observerEcf.x,
        y: positionEcf.y - observerEcf.y,
        z: positionEcf.z - observerEcf.z
    };

    var rangeUnitVector = {
        x: rangeEcf.x / Math.sqrt(rangeEcf.x * rangeEcf.x + rangeEcf.y * rangeEcf.y + rangeEcf.z * rangeEcf.z),
        y: rangeEcf.y / Math.sqrt(rangeEcf.x * rangeEcf.x + rangeEcf.y * rangeEcf.y + rangeEcf.z * rangeEcf.z),
        z: rangeEcf.z / Math.sqrt(rangeEcf.x * rangeEcf.x + rangeEcf.y * rangeEcf.y + rangeEcf.z * rangeEcf.z)
    };

    var rangeRate = relativeVelocityEcf.x * rangeUnitVector.x +
                    relativeVelocityEcf.y * rangeUnitVector.y +
                    relativeVelocityEcf.z * rangeUnitVector.z;

    return rangeRate; 
}


setInterval(updateTelemetryData, 5000);
