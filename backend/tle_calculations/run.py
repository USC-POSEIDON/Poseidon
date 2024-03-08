#!/usr/bin/env python3
from tle_calculations import app
from tle_calculations.celestrak_calls import createTables



if __name__ == '__main__':
    print("flask startup :)")
    createTables()
    app.run(debug=False, port=5000)

    #production mode 
    # app.run()