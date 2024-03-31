#!/usr/bin/env python3
from tle_calculations import app
from backend.tle_calculations.tle import createTables



if __name__ == '__main__':
    print("flask startup :)")
    createTables()
    app.run(debug=False, port=5000)

    #production mode 
    # app.run()