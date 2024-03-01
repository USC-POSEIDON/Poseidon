from tle_calculations import app
from tle_calculations.celestrak_calls import createTables

if __name__ == '__main__':
    print("flask startup :)")
    createTables()
    app.run()