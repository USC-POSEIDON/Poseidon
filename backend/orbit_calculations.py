import json
import sys
from datetime import datetime, timezone, timedelta
import time

from sgp4.api import Satrec, jday, SGP4_ERRORS
from sgp4.conveniences import dump_satrec, jday_datetime, UTC
from skyfield.api import EarthSatellite, load, wgs84
import scipy.constants as const
from flask import Flask, request, jsonify

from celestrak_calls import app

# Constants
GS_LATITUDE = 34.0208
GS_LONGITUDE = -118.2910
DEFAULT_UPLINK_FREQ = 145.000
DEFAULT_DOWNLINK_FREQ = 145.000

# Global Vars 
# TODO: decide if these need to be global
# TODO: init latlon with stored value on startup
observer = wgs84.latlon(GS_LATITUDE, GS_LONGITUDE)
ts = load.timescale()

class PassLine:
    def __init__(self, date, az, el, range):
        self.date = date
        self.az = az
        self.el = el
        self.range = range

class Pass:
    def __init__(self, catnr, rise: PassLine, culminate: PassLine, set: PassLine):
        self.catnr = catnr
        self.rise = rise
        self.culminate = culminate
        self.set = set

@app.route('/satellites/passes', methods=['GET'])
def getPassTimeInfo():
    """Get pass time info.

    Predicts all pass times for a given TLE for the next # of days.
    Includes datetime, azimuth (deg), elevation (deg), and slant range (km).

    Required params:
        s: TLE line 1.
        t: TLE line 2.
    Optional params:
        name: Satellite name
        days: Number of days to predict (default 7).
        min_deg: Minimum degree for a pass (default 5.0°)

    Returns:
        A list of Pass objects. 
            Each Pass has a catnr (catalog number)
                and three PassLines: rise, culminate, and set.
            Each PassLine has:
                date: UTC date string, formatted like so - 2024 Feb 12 21:41:06
                az: Azimuth in degrees
                el: Elevation in degrees
                range: Slant range in km

        And the corresponding JSON string.

    Raises:
        RuntimeError: If passes not predicted as expected.
    """
    # TODO: check if catnr matches TLE?
    

    
    s = request.args.get('s')
    t = request.args.get('t')
    catnr = request.args.get('catnr')

    # TODO: decide error behavior
    if not s:
        return "No TLE line 1", 400
    if not t:
        return "No TLE line 2", 400
    if not catnr: 
        return "No CatNr", 400

    try:
        name = request.args.get('name') if request.args.get('name') else '???'
        days = int(request.args.get('days')) if request.args.get('days') else 7
        min_deg = float(request.args.get('min_deg')) if request.args.get('min_deg') else 5.0
    except:
        return "Incorrect type for days or min_deg.", 400

    # Create Skyfield satellite and observer (groundstation) objects
    satellite = EarthSatellite(s, t, name, ts)
    difference = satellite - observer

    # Set start and end time (UTC)
    startDate = datetime.now(tz=timezone.utc)
    endDate = startDate + timedelta(days = int(days))
    t0 = ts.utc(startDate.year, startDate.month, startDate.day)
    t1 = ts.utc(endDate.year, endDate.month, endDate.day)

    # Prediction
    t, events = satellite.find_events(observer, t0, t1, altitude_degrees=min_deg)
    event_names = 'rise', 'culminate', 'set'
    passes = []
    rise: PassLine = None
    culminate: PassLine = None
    set: PassLine = None

    for ti, event in zip(t, events):
        pos = difference.at(ti)
        alt, az, _ = pos.altaz()
        _, _, range, _, _, _ = pos.frame_latlon_and_rates(observer)
        name = event_names[event]
        date = ti.utc_strftime('%Y %b %d %H:%M:%S')
        if name == 'rise':
            rise = PassLine(date, az.degrees, alt.degrees, range.km)
        elif name == 'culminate':
            culminate = PassLine(date, az.degrees, alt.degrees, range.km)
        else:
            set = PassLine(date, az.degrees, alt.degrees, range.km)
            if rise == None:
                raise RuntimeError
            passes.append(Pass(catnr, rise, culminate, set))

    json_string = json.dumps(passes, default=vars, indent=4)
    print(json_string)
    return passes, json_string

def getPassDict(satellites):
    """Get pass times for a list of satellites.

    Args:
        satellites: List of satellite catalog numbers.

    Returns:
        A dictionary mapping satellite catalog number to list of passes. 
    """
    # TODO
    for catnr in satellites:
        pass

@app.route('/satellites/telemetry', methods=['GET'])
def getCurrentTelemetry():
    """Get realtime Doppler-adjusted transmit/receive frequencies.

    Pass in uplink/downlink frequencies if known, otherwise parse csv for frequencies.
    Use default frequencies if needed.

    Required params:
        s: TLE line 1.
        t: TLE line 2.
    Optional params:
        downlink: Satellite downlink frequency (MHz).
        uplink: Satellite uplink frequency (MHz).
        
    Returns:
        Json dictionary of telemetry data:
            az (deg)
            el (deg)
            alt (km)
            range (km)
            range_rate (km/s)
            rec (MHz)
            trans (MHz)
    """
    print("hellobello")
    sys.stdout.flush()

    s = request.args.get('s')
    t = request.args.get('t')

    if not s or not t:
        return "Missing TLE Line", 400

    try:
        downlink = float(request.args.get('downlink')) if request.args.get('downlink') else DEFAULT_DOWNLINK_FREQ
        uplink = float(request.args.get('uplink')) if request.args.get('uplink') else DEFAULT_UPLINK_FREQ
    except:
        return "Incorrect type for uplink/downlink frequency.", 400

    # TODO: add csv parsing for up/downlink

    satellite = EarthSatellite(s, t, "", ts)
    difference = satellite - observer
    pos = difference.at(ts.now())
    _, _, range, _, _, range_rate = pos.frame_latlon_and_rates(observer)
    el, az, _ = pos.altaz()
    height = wgs84.height_of(satellite.at(ts.now()))

    # per https://en.wikipedia.org/wiki/Doppler_effect
    # receive: where satellite = source
    receive_freq = (const.c) / (const.c+ range_rate.km_per_s*1000) * downlink
    # transmit: where ground station = source TODO: figure out why wiki should be c - rate
    transmit_freq = (const.c + range_rate.km_per_s*1000) / (const.c) * uplink

    ans = {}
    ans["az"] = az.degrees
    ans["el"] = el.degrees
    ans["alt"] = height.km
    ans["range"] = range.km
    ans["range_rate"] = range_rate.km_per_s
    ans["rec"] = receive_freq
    ans["trans"] = transmit_freq

    json_string =  json.dumps(ans)
    print(json_string)
    return json_string, 200


@app.route('/satellites/groundstation', methods=['POST'])
def changeGroundStation():
    """Change the global observer object.

    Required form params:
        lat: New latitude.
        lon: New longitude.
    """
    lat = request.form['lat']
    lon = request.form['lon']

    global observer
    observer = wgs84.latlon(lat, lon)


if __name__ == "__main__":
    rangeToPredict = input("Enter passtime range (days from present): ")
    f = open("tle_data.txt", 'r')
    while 1: 
        name = f.readline()
        s = f.readline()
        t = f.readline()

        if not name: # EOF
            break
        # getPassTimeInfo(s, t, 0, name=name)

        for i in range(20): 
            time.sleep(1)
            (getCurrentTelemetry(s,t))
    
    f.close()



'''
Things to remember/consider
[1] Beware that events might not always be in the order rise-culminate-set. 
    Some satellites culminate several times between rising and setting.
[2] ~~Keeping a list of EarthSatellite objects instead of txt of TLE's?~~
[3] Desired info: pass times (within 30 sec), azimuth/elevation angles (within 10 deg), 
    min/max slant range (within 50 km), doppler shift range (within 5 MHz)
[4] Converting pass times from UTC -> local time?


# Skyfield method for getting satellites from CelesTrak (loads to gp.php)
stations_url = 'http://celestrak.org/NORAD/elements/stations.txt'
active_url = f"{BASE_URL}?GROUP=active&{DEFAULT_FORMAT}"
satellites = load.tle_file(active_url, reload=True)
print('Loaded', len(satellites), 'satellites')

by_number = {sat.model.satnum: sat for sat in satellites}
satellite = by_number[DODONA_CATNR]
print(satellite)

'''