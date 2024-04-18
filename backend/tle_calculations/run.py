#!/usr/bin/env python3
from tle_calculations import app
from tle_calculations.tle import createTables
from tle_calculations.orbit import initGroundStation



if __name__ == '__main__':
    print("flask startup :)")
    createTables()
    initGroundStation()
    app.run(debug=False, port=5000)

    #production mode 
    # app.run()