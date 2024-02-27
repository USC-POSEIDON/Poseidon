from tle_calculations import app
from tle_calculations.celestrak_calls import getLogin, createTables

if __name__ == '__main__':
    print("flask startup :)")
    getLogin()
    # createTables()
    app.run()