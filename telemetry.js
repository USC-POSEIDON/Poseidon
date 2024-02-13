function updateTelemetryData() {
    var now = new Date();

    //TODO: Mock Data Here
    var observerPos = {
        latitude: 40.7128,
        longitude: -74.0060,
        height: 0
    };

    var positionAndVelocity = satellite.propagate(satrec, now);
    var positionEci = positionAndVelocity.position;
    var velocityEci = positionAndVelocity.velocity;
    var gmst = satellite.gstime(now);

    if (positionEci && positionEci.x !== undefined && positionEci.y !== undefined && positionEci.z !== undefined) {
        var observerGd = {
            longitude: satellite.degreesToRadians(observerPos.longitude),
            latitude: satellite.degreesToRadians(observerPos.latitude),
            height: observerPos.height
        };
        
        var positionEcf = satellite.eciToEcf(positionEci, gmst);
        var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
        var altitude = calculateAltitude(positionEci);
        var footprint = calculateFootprint(altitude);
        var velocity = calculateVelocity(velocityEci);

        // Check if look angles are defined before updating the HTML
        if (lookAngles && lookAngles.azimuth !== undefined && lookAngles.elevation !== undefined) {
            var azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
            var elevation = satellite.radiansToDegrees(lookAngles.elevation);

            //TODO: fix here
            var rangeRate = lookAngles.rangeRate; 

            //TODO: Mock Data Here
            var frequency = 437.5; 
            var doppler = calculateDoppler(frequency, rangeRate);

            document.getElementById('azimuth').textContent = azimuth.toFixed(2) + '°';
            document.getElementById('elevation').textContent = elevation.toFixed(2) + '°';
            document.getElementById('slantRange').textContent = (lookAngles.range * 0.001).toFixed(2) + ' km'; 
            //TODO: Fix here once rangeRate is fixed
            //document.getElementById('rangeRate').textContent = rangeRate.toFixed(2) + ' m/s';
            document.getElementById('altitude').textContent = altitude.toFixed(2) + ' km';
            document.getElementById('footprint').textContent = footprint.toFixed(2) + ' km';
            document.getElementById('velocity').textContent = velocity.toFixed(2) + ' km/s';
            document.getElementById('doppler').textContent = doppler.toFixed(2) + ' Hz';
        } else {
            console.error('Look angles are undefined.');
        }
    } else {
        console.error('PositionEci is undefined.');
    }
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


setInterval(updateTelemetryData, 1000);
