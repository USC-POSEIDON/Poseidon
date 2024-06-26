import json
import sys
from datetime import datetime, timezone, timedelta
from sgp4.api import Satrec, jday, SGP4_ERRORS
from sgp4.conveniences import dump_satrec, jday_datetime, UTC
from skyfield.api import EarthSatellite, load, wgs84, Topos
import scipy.constants as const
from flask import Flask, abort, request, jsonify
from tle_calculations.database import *
from tle_calculations import app
from zoneinfo import ZoneInfo

# Constants
GS_LATITUDE = 34.0208
GS_LONGITUDE = -118.2910
DEFAULT_UPLINK_FREQ = 145.000
DEFAULT_DOWNLINK_FREQ = 145.000

# Global Vars 
observer = wgs84.latlon(GS_LATITUDE, GS_LONGITUDE)
ts = load.timescale()

class PassLine:
    def __init__(self, name, catnr, label, date, az, el, range):
        self.name = name
        self.catnr = catnr
        self.label = label
        self.date = date
        self.az = az
        self.el = el
        self.range = range

# class Pass:
#     def __init__(self, name, catnr, rise: PassLine, culminate: PassLine, set: PassLine):
#         self.name = name
#         self.catnr = catnr
#         self.rise = rise
#         self.culminate = culminate
#         self.set = set

def initGroundStation():
    """ Set observer to ground station coordinates from database (if exists) """
    lat, lon = getGSCoordinates()
    if lat is not None and lon is not None:
        global observer
        observer = wgs84.latlon(lat, lon)
    else:
        # Coordinates default to GS_LATITUDE, GS_LONGITUDE
        pass

@app.route('/health', methods=['GET'])
def health_check():
    """ This endpoint is used for indicating that the backend is up and running. """
    return jsonify({'status': 'up'}), 200

# ====================== GET REQUESTS ======================

@app.route('/calculations/passes', methods=['GET'])
def getPassTimeInfo():
    """Get pass time info.

    Predicts all pass times for a given TLE for the next # of days.
    Includes datetime, azimuth (deg), elevation (deg), and slant range (km).

    Required params:
        s: TLE line 1.
        t: TLE line 2.
        catnr
        timezone: UTC / Local
    Optional params:
        name: Satellite name
        days: Number of days to predict (default 7).
        min_deg: Minimum degree for a pass (default 5.0°)

    Returns:
        A list of PassLine objects. 
            Each PassLine has: 
                catnr (catalog number)
                date: UTC date string, formatted like so - 2024 Feb 12 21:41:06
                az: Azimuth in degrees
                el: Elevation in degrees
                range: Slant range in km
                label: rise/culminate/set

        And the corresponding JSON string.

    Raises:
        RuntimeError: If passes not predicted as expected.
    """
        
    s = request.args.get('s')
    t = request.args.get('t')
    catnr = request.args.get('catnr')
    satname = request.args.get('name', 'Unknown Satellite')
    tz_select = request.args.get('timezone', 'UTC').strip()

    if not s or not t or not catnr:
        abort(400, description='Missing required TLE or catalog number parameters')

    try:
        days = int(request.args.get('days', '7'))
        min_deg = float(request.args.get('min_deg', '5.0'))
    except ValueError:
        abort(400, description="Invalid 'days' or 'min_deg' parameter")

    # Configure the timezone and start date
    if tz_select.upper() == 'UTC':
        timezone = ZoneInfo('UTC')
        startDate = datetime.now(timezone)
    else:
        # If not UTC, use local time
        startDate = datetime.now()

    # Setup satellite and observer
    satellite = EarthSatellite(s, t, satname, ts)
    endDate = startDate + timedelta(days=days)
    t0 = ts.utc(startDate.year, startDate.month, startDate.day)
    t1 = ts.utc(endDate.year, endDate.month, endDate.day)

    # Calculate events
    t, events = satellite.find_events(observer, t0, t1, altitude_degrees=min_deg)
    event_names = ['rise', 'closest pt.', 'set']
    passes = []

    for ti, event in zip(t, events):
        pos = satellite - observer
        pos = pos.at(ti)
        alt, az, dist = pos.altaz()
        label = event_names[event]
        date = ti.utc_strftime('%Y %b %d %H:%M:%S')
        utc = datetime.strptime(date, '%Y %b %d %H:%M:%S').replace(tzinfo=ZoneInfo("UTC"))
        if tz_select.upper() == 'UTC':
            local_date = utc.astimezone(ZoneInfo('UTC'))
        else:
            local_date = utc.astimezone()  # Automatically converts to local system timezone
        formatted_date = local_date.strftime('%Y %b %d %H:%M:%S')

        passes.append({
            'satname': satname,
            'catnr': catnr,
            'label': label,
            'date': formatted_date,
            'az': az.degrees,
            'el': alt.degrees,
            'range': dist.km
        })

    return jsonify(passes), 200

@app.route('/calculations/telemetry', methods=['GET'])
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
    # Just for testing
    getAllCatnrs() 

    s = request.args.get('s')
    t = request.args.get('t')

    if not s or not t:
        abort(400, description='Missing TLE line.')

    try:
        downlink = float(request.args.get('downlink')) if request.args.get('downlink') else DEFAULT_DOWNLINK_FREQ
        uplink = float(request.args.get('uplink')) if request.args.get('uplink') else DEFAULT_UPLINK_FREQ
    except:
        abort(400, description='Incorrect type for uplink/downlink frequency.')

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
    sys.stdout.flush()
    return json_string, 200

@app.route('/calculations/get/groundstation', methods=['GET'])
def getGroundStation():
    """Return the groundstation coordinates.
    
    Returns:
        200 OK if exists
        400 Error if not exists
    """
    lat, lon = getGSCoordinates()
    if lat is not None and lon is not None:
        return jsonify({"lat": lat, "lon": lon}), 200
    else:
        # set default coordinates
        global observer
        observer = wgs84.latlon(GS_LATITUDE, GS_LONGITUDE)  # Ensure lat and lon are floats
        updateGSCoordinates(GS_LATITUDE, GS_LONGITUDE)

        return jsonify({"lat": GS_LATITUDE, "lon": GS_LONGITUDE}), 200


# ====================== POST REQUESTS =====================

@app.route('/calculations/post/groundstation', methods=['POST'])
def changeGroundStation():
    """Change the global observer object, and save lat, lon to database. """
    data = request.get_json() 

    if not data or 'lat' not in data or 'lon' not in data:
        # If any required field is missing, return a 400 Bad Request response
        return jsonify({"error": "Missing lat or lon"}), 400

    lat = data['lat']
    lon = data['lon']

    global observer
    observer = wgs84.latlon(float(lat), float(lon))  # Ensure lat and lon are floats

    updateGSCoordinates(lat, lon)

    return jsonify({"message": "Ground station updated successfully"}), 200