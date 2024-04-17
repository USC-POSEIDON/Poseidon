import datetime as dt
import sys
import requests
from flask import Flask, abort, request, jsonify

from tle_calculations.database import *
from tle_calculations import app

DODONA_CATNR = 51084
TEST_SATLIST = [25544, 123, 1253, 2, 900, 51084]

BASE_URL = "https://celestrak.org/NORAD/elements/gp.php"
DEFAULT_FORMAT = "FORMAT=TLE"
FILE_EXT = "txt"


# ====================== HELPER FUNCTION ======================

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

# ====================== GET REQUESTS ======================

@app.route('/satellites/get/names/<name>', methods=['GET'])
def getNames(name):
    """Get a list of satellite names containing "name"

    Args:
        name: Search term for satellite name.

    Returns:
        A list of satellites.
        Each entry has (name, catnr)
    """

    api_url = f"{BASE_URL}?NAME={name}&{DEFAULT_FORMAT}"
    response = requests.get(api_url).text.splitlines()

    # Create list of (name, catnr)
    satlist = []
    while len(response) >= 3:
        currname = response[0].rstrip()
        catnr = int(response[1][2:7])
        satlist.append((currname, catnr))
        response = response[3:]

    
    print("[BACKEND] Returning satlist with "+name+" of size "+str(len(satlist)))
    sys.stdout.flush()

    return jsonify({"satellites": satlist}), 200

@app.route('/satellites/get/preset/<listname>', methods=['GET'])
def getPresetList(listname):
    '''Get a list of satellites in a particular preset list (listname).
    
    Returns:
        list of satellites (catnr, name, TLE line 1, TLE line 2)
    '''
    list = getSatellitesInPreset(listname) # [sat[1] for sat in list]
    return jsonify({"satellites": list}), 200

@app.route('/satellites/get/allpresets', methods=['GET'])
def getAllPresets():
    """ Return a json containing a list of all Preset List Names under "names." """
    return jsonify({"names": getAllPresetNames()}), 200

@app.route('/satellites/get/updatetime/<catnr>', methods=['GET'])
def getDatetime(catnr):
    """ Return datetime of when a TLE was last updated. """
    update_time = getUpdateTime(catnr)

    if update_time:
        return jsonify({"time": str(update_time)}), 200
    else:
        return jsonify({"message": "Invalid catnr"}), 400
    
@app.route('/satellites/get/tle/<catnr>', methods=['GET'])
def getSingleTLE(catnr):
    """ Return TLE given catnr. """
    tle = getStoredTLE(catnr)

    if tle:
        return jsonify({"tle": tle}), 200
    else:
        return jsonify({"message": "Invalid catnr"}), 400



# ====================== POST REQUESTS =====================

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
    
    listname = request.form['listname']
    # TODO: catch KeyError, or handle HTTP 400 response 
    if listname == "":
        abort(400, description='POST request unsuccessful: Preset list to add to has type \"\"')

    tleData = getTLE(catnr)
    if tleData[0] != None:
        name = tleData[0].rstrip()
        current_datetime = datetime.now()
        current_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

        # Insert to TLE_Data
        insertTLE(catnr, tleData[1], tleData[2], current_datetime)

        # Insert to Satellites table
        id = getSatelliteID(catnr)
        insertSatellite(id, catnr, name, listname)

        return jsonify({"message": "POST request successful"}), 200
    
    abort(400, description='POST request unsuccessful: invalid CATNR entered')

@app.route('/satellites/post/manual/tle', methods=['POST'])
def addNewTLEManually():
    data = request.form
    # Handle the received form data
    print("Received form data:", data)
    
    line1 = data.get('s')
    line2 = data.get('t')
    name = data.get('name')
    listname = data.get('listname')
    if line1 == None or line2 == None or name == None or listname == None:
        abort(400, description='POST request unsuccessful: Form incomplete')
    if listname == "":
        abort(400, description='POST request unsuccessful: Preset list to add to has type \"\"')

    # Get current datetime
    current_datetime = datetime.now()
    current_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    # Insert to TLE_Data
    catnr = insertTLE(None, line1, line2, current_datetime)

    # Insert to Satellites table
    id = getSatelliteID(catnr)
    insertSatellite(id, catnr, name, listname)

    return jsonify({"message": "POST request successful"}), 200
      
@app.route('/satellites/post/preset/<listname>', methods=['POST'])
def addPreset(listname):
    """ Create a new empty preset list. If list already exists, do nothing. """

    insertPreset(listname)
    return jsonify({"message": "POST request successful"}), 200

@app.route('/satellites/rename/preset/<listname>/<newname>', methods=['POST'])
def renamePresetList(listname, newname):
    """Rename a preset list to newname

    Returns:
        200 OK if success
        400 error if not success (newname already exists)
    """
    result = renamePreset(listname, newname)
    
    if result == -1:
        return jsonify({"message": "POST request unsuccessful: list name already exists"}), 400
        
    return jsonify({"message": "POST request successful"}), 200

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

    # Get current datetime
    current_datetime = datetime.now()
    current_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
    print(current_datetime)
    sys.stdout.flush()

    # Update TLEs for all satellites
    for catnr in catnr_list:
        print("trying to update " + str(catnr))
        if catnr in tle_dict.keys():
            print("updating " + str(catnr))
            updateTLE(catnr, tle_dict[catnr][1], tle_dict[catnr][2], current_datetime)

    return jsonify({"message": "POST request successful"}), 200


# ====================== DELETE REQUESTS =====================

@app.route('/satellites/delete/preset/<listname>', methods=['DELETE'])
def deletePreset(listname):
    """ Delete a preset list and all of its satellites. 
    
    Also deletes the satellite from TLE data table 
    if the satellite is not in any other preset list.

    """

    deletePresetList(listname)
    return jsonify({"message": "DELETE request successful"}), 200

@app.route('/satellites/delete/satellite/<catnr>/<listname>', methods=['DELETE'])
def deleteSatellite(catnr, listname):
    """ Remove satellite with catnr = <catnr> from list = <listname>. 
    
    Also remove the satellite's TLE data if it is not in any other preset list. """
    
    deleteSatelliteFromList(catnr, listname)
    return jsonify({"message": "DELETE request successful"}), 200
