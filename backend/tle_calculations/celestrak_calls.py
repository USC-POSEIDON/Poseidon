import datetime as dt
import sys
import requests
from flask import Flask, request, jsonify

from tle_calculations.database import *
from tle_calculations import app
# app = Flask(__name__)

DODONA_CATNR = 51084
TEST_SATLIST = [25544, 123, 1253, 2, 900, 51084]

BASE_URL = "https://celestrak.org/NORAD/elements/gp.php"
DEFAULT_FORMAT = "FORMAT=TLE"
FILE_EXT = "txt"



@app.route('/api/data', methods=['POST'])
def handle_post_request():
    if request.method == 'POST':
        data = request.form
        # Handle the received form data
        print("Received form data:", data)
        sys.stdout.flush()
        # Process the data and return a response if needed
        response_data = {'message': 'Form data received successfully'}
        return jsonify(response_data), 200

def getTLE(VALUE=DODONA_CATNR, QUERY="CATNR"):
    """Get TLE data from CelesTrak given query type and query value.

    Currently written to only query one result.
    E.g. searching by a specific CATNR results in one satellite TLE.  

    Args:
        QUERY: Type to query by.
        VALUE: Value to query.

    Returns:
        Tuple of name, TLE line 1, TLE line 2.
    """
    api_url = f"{BASE_URL}?{QUERY}={VALUE}&{DEFAULT_FORMAT}"
    response = requests.get(api_url).text.splitlines()

    # Error checking
    if len(response) < 3:
        return None, None, None 

    return response[0], response[1], response[2]

@app.route('/satellites/get/names/<name>', methods=['GET'])
def getNames(name):
    """Get a list of satellite names containing "name"

    Args:
        name: Search term for satellite name.

    Returns:
        A list of satellite names.
        TODO: Should we return catalog number + TLE as well?

    Raises:
        RuntimeError: If passes not predicted as expected.
    """
    api_url = f"{BASE_URL}?NAME={name}&{DEFAULT_FORMAT}"
    response = requests.get(api_url).text.splitlines()
    
    return [line.rstrip() for line in response[0::3]]

@app.route('/satellites/get/preset/<listname>', methods=['GET'])
def getPresetList(listname):
    '''Get a list of satellites in a particular preset list (listname).
    
    Returns:
        list of satellites (catnr, name, TLE line 1, TLE line 2)
    '''
    list = getSatellitesInPreset(listname) # [sat[1] for sat in list]
    return jsonify({"satellites": list})

@app.route('/satellites/get/allpresets', methods=['GET'])
def getAllPresets():
    return jsonify({"names": getAllPresetNames()})

@app.route('/satellites/post/catnr/<catnr>', methods=['POST'])
def addNewTLEByCATNR(catnr):
    """Add a new satellite by catalog number.

    Add the satellite to the Satellites table (name, label).
    Also add the satellite TLE to TLE_data.
    Do nothing if catalog number is invalid.

    Args:
        catnr (url): Satellite catalog number.
        listname (form argument): Preset list name.
    """
    if request.method == 'POST':
        data = request.form
        # Handle the received form data
        print("Received form data:", data)
        sys.stdout.flush()
    
    listname = request.form['listname']
    # TODO: catch KeyError, or handle HTTP 400 response 

    tleData = getTLE(catnr)
    if tleData[0] != None:
        name = tleData[0].rstrip()

        # Insert to TLE_Data
        insertTLE(catnr, tleData[1], tleData[2])

        # Insert to Satellites table
        id = getSatelliteID(catnr)
        insertSatellite(id, catnr, name, listname)

        return 'Success'
    
    return 'Error: Invalid catnr'

# @app.route('/satellites/post/tle', methods=['POST'])
# def addNewTLE(line1, line2, ):
#     pass


@app.route('/satellites/delete/preset/<listname>', methods=['DELETE'])
def deletePreset(listname):
    deletePresetList(listname)
    return "Success"

@app.route('/satellites/delete/satellite/<catnr>/<listname>', methods=['DELETE'])
def deleteSatellite(catnr, listname):
    deleteSatelliteFromList(catnr, listname)
    return "Success"

@app.route('/satellites/update', methods=['POST'])
def updateTLEs():
    """Refresh all TLEs by parsing through CelesTrak's active group."""
    
    api_url = f"{BASE_URL}?GROUP=active&{DEFAULT_FORMAT}"
    response = requests.get(api_url).text.splitlines()

    # Create dictionary of active satellites
    tle_dict = {}
    while len(response) >= 3:
        tle_dict[int(response[1][2:7])] = response[0:3]
        response = response[3:]

    # Get list of all satellite catnrs
    catnr_list = getAllCatnrs()

    # Update TLEs for all satellites
    for catnr in catnr_list:
        if catnr in tle_dict.keys():
            updateTLE(catnr, tle_dict[catnr][1], tle_dict[catnr][2])

    # TODO: when TLEs are updated, pass times should also be
    return "Success"

if __name__ == "__main__":
    print("flask startup :)")
    getLogin()
    createTables()
    app.run()