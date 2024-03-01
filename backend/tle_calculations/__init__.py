# https://flask.palletsprojects.com/en/2.2.x/patterns/packages/
from flask import Flask
app = Flask(__name__)

import tle_calculations.orbit_calculations
import tle_calculations.celestrak_calls

