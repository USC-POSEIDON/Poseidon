# https://flask.palletsprojects.com/en/2.2.x/patterns/packages/
from flask import Flask

app = Flask(__name__)

import backend.tle_calculations.orbit
import backend.tle_calculations.tle

