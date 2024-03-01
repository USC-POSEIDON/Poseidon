# https://flask.palletsprojects.com/en/2.2.x/patterns/packages/
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

import tle_calculations.orbit_calculations
import tle_calculations.celestrak_calls

