#!/usr/bin/env python3
from tle_calculations import app
from tle_calculations.tle import createTables
from tle_calculations.orbit import initGroundStation
import os
from waitress import serve
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)

def create_app():
    """Application factory for creating Flask app instances."""
    createTables()
    initGroundStation()
    return app

if __name__ == '__main__':
    if os.getenv("FLASK_ENV") == "development":
        # If in development, use Flask's built-in server with debug enabled
        app.run(debug=True, host='127.0.0.1', port=5000)
    else:
        # In production, use Waitress to serve the Flask application
        app = create_app()
        logging.info("Starting Waitress server for production...")
        serve(app, host='127.0.0.1', port=5000)
