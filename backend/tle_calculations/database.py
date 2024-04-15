from datetime import datetime, timedelta
from configparser import ConfigParser
import os
import sqlite3
import sys

params: dict
if getattr(sys, 'frozen', False):
        # If so, the database is located in the same directory as the executable
    db_path = os.path.join(sys._MEIPASS, 'poseidon.db')
else:
        # If not, use a development path or a relative path
    db_path = "backend/poseidon.db"

def createTables():
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # # Define the tables to be dropped
    # tables_to_drop = ['Satellites', 'TLE_Data', 'Satellite_Passes']

    # # Loop through each table name and drop it if it exists
    # for table_name in tables_to_drop:
    #     cur.execute(f"DROP TABLE IF EXISTS {table_name}")

    conn.commit()

    # Create tables
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Ground_Station (
            latitude REAL,
            longitude REAL
        );        
    """)
    
    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS TLE_Data (
            tle_id INTEGER PRIMARY KEY AUTOINCREMENT,
            catnr INTEGER,
            line1 TEXT,
            line2 TEXT,
            epoch REAL,
            update_time DATETIME,
            UNIQUE(catnr)
        );        
    """)
    
    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS Satellites (
            satellite_id INTEGER PRIMARY KEY AUTOINCREMENT,
            tle_id INTEGER REFERENCES TLE_Data(tle_id),
            catnr INTEGER,
            name TEXT,
            type TEXT,
            UNIQUE(catnr, type)
        );
    """)

    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS Satellite_Passes (
            pass_id INTEGER PRIMARY KEY AUTOINCREMENT,
            satellite_id INTEGER REFERENCES Satellites(satellite_id),
            time TIMESTAMP,
            azm REAL,
            elv REAL,
            range REAL
        );
    """)

    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS Preset_Names (
            preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        );
    """)

    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def updateGSCoordinates(lat, lon):
    # Check if latlon exists 
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('SELECT latitude, longitude FROM Ground_Station LIMIT 1')
    row = cursor.fetchone()
    
    # If exists, update first row's lat lon
    if row:
        cursor.execute('UPDATE Ground_Station SET latitude = ?, longitude = ? WHERE ROWID = 1', (lat, lon))
        conn.commit()
    # Else, add row lat lon to table
    else:
        cursor.execute('INSERT INTO Ground_Station (latitude, longitude) VALUES (?, ?)', (lat, lon))
        conn.commit()        
    
    # Close the connection
    conn.close()

def getGSCoordinates():
    """ Return first row of Ground_Station """

    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('SELECT latitude, longitude FROM Ground_Station LIMIT 1')
    row = cursor.fetchone()

    # Close the connection
    conn.close()

    if row:
        latitude, longitude = row
        return latitude, longitude
    else:
        return None, None

def insertSatellite(tle_id, catnr, name, type):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT OR IGNORE INTO Satellites (
        tle_id, catnr, name, type
    ) VALUES (?, ?, ?, ?);
    """

    cur.execute(sql, (tle_id, catnr, name, type))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

    # TODO: return something so frontend knows if repeated addition

def insertTLE(catnr, line1, line2, datetime):
    epoch = float(line1[18:32])
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT OR IGNORE INTO TLE_Data (catnr, line1, line2, epoch, update_time)
    VALUES (?, ?, ?, ?, ?);
    """

    cur.execute(sql, (catnr, line1, line2, epoch, datetime))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def insertPass(satellite_id, time, azm, elv, range):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT INTO Satellite_Passes (satellite_id, time, azm, elv, range)
    VALUES (?, ?, ?, ?, ?)
    """

    cur.execute(sql, (satellite_id, time, azm, elv, range))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def insertPreset(name):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT INTO Preset_Names (name)
    VALUES (?)
    """

    cur.execute(sql, (name,))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def renamePreset(oldname, newname):
    '''
    Rename a preset list

    Args:
        oldname: old preset list name
        newname: new name to rename the preset list to

    Returns:
        0 if success, -1 if newname already exists 
    If newname not exists in Preset_Names
        in Preset_Names, rename oldname to newname
        in Satellites, rename all TLE of 'type' = oldname to newname
    Else
        return error
    '''
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    UPDATE Preset_Names
    SET name = ?
    WHERE name = ?
    AND NOT EXISTS (SELECT 1 FROM Preset_Names WHERE name = ?)
    """

    cur.execute(sql, (newname, oldname, newname,))
    conn.commit()

    # Check the number of affected rows
    if cur.rowcount == 0:
        # "newname" already exists
        print("ERROR: Newname already exists")
        sys.stdout.flush()
        return -1
    else:
        # "newname" was successfully updated
        sql = """
        UPDATE Satellites
        SET type = ?
        WHERE type = ?
        """

        cur.execute(sql, (newname, oldname,))
        conn.commit()

        print("Entry updated successfully")
        sys.stdout.flush()

    # Close the connection
    cur.close()
    conn.close()

def getSatelliteID(catnr):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement
    cur.execute("SELECT tle_id FROM TLE_Data WHERE catnr = ?", (catnr,)) 

    # Retrieve the result
    row = cur.fetchone()  # fetchone() retrieves the next row of a query result set or None if no more rows are available.

    # Close the cursor and the connection
    cur.close()
    conn.close()

    # Check if a row was returned
    if row is not None:
        return row[0]  # Return the satellite_id as an integer
    else:
        return None # Return None if no row was returned


def getPassesbyName(name):
    conn = sqlite3.connect(db_path)
                            
    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Prepare the SQL query with JOIN to link Satellite_Passes to the Satellites table using the satellite name
    query = """
    SELECT Satellite_Passes.*
    FROM Satellite_Passes
    JOIN Satellites ON Satellite_Passes.satellite_id = Satellites.satellite_id
    WHERE Satellites.name = ?
    """

    # Execute a SELECT statement
    cur.execute(query, (name,))

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows


def getPassesbyName(name):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Prepare the SQL query to join Satellite_Passes with Satellites and select passes by satellite name
    query = """
    SELECT Satellite_Passes.*
    FROM Satellite_Passes
    INNER JOIN Satellites ON Satellite_Passes.satellite_id = Satellites.satellite_id
    WHERE Satellites.name = ?
    """

    # Execute a SELECT statement
    cur.execute(query, (name,))

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows


def getAllCatnrs():
    '''Get a list of catalog numbers of all satellites.'''
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement (unchanged)
    cur.execute("SELECT catnr FROM TLE_Data")

    # Retrieve the results
    rows = cur.fetchall()

    # Extract catnr from tuple
    catnrs = list(map(lambda x: x[0], rows))
    print("whats in rows? " + str(catnrs))
    sys.stdout.flush()
    

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return catnrs

def getAllPresetNames():
    '''Get a list of all preset names.'''
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement (unchanged)
    cur.execute("SELECT name FROM Preset_Names ORDER BY name ASC")

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows

def getSatellitesInPreset(type):
    '''Get a list of satellites in a particular preset list (type).
    
    Returns:
        list of satellites (catnr, name, TLE line 1, TLE line 2)
    '''
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    query = """
    SELECT Satellites.catnr, Satellites.name, TLE_Data.line1, TLE_Data.line2 
    FROM Satellites
    JOIN TLE_Data ON Satellites.tle_id = TLE_Data.tle_id
    WHERE type = ?
    """
    # TODO: maybe remove catnr, name from Satellites table. just be mapping of TLE_id -> preset name

    # Execute a SELECT statement
    cur.execute(query, (type,))

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows

def getAllTLEs():
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement (unchanged)
    cur.execute("SELECT * FROM tle_data")

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows

def getStoredTLE(catnr):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement (unchanged)
    cur.execute("SELECT line1, line2 FROM tle_data WHERE catnr=?", (catnr,))

    # Retrieve the results
    row = cur.fetchone()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return row

def getUpdateTime(catnr):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement (unchanged)
    cur.execute("SELECT update_time FROM tle_data where catnr = ?", (catnr,))

    # Retrieve the results
    result = cur.fetchone()

    # Convert the retrieved string to a Python datetime object
    update_datetime = None
    if result:
        update_datetime_str = result[0]
        print(update_datetime_str)
        sys.stdout.flush()
        update_datetime = datetime.strptime(update_datetime_str, "%Y-%m-%d %H:%M:%S")

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return update_datetime
    
def deletePresetList(type):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Delete from Preset Names
    cur.execute("DELETE FROM Preset_Names WHERE name = ?", (type,))


    # Fetch the rows to be deleted before executing the DELETE statement
    cur.execute("SELECT * FROM Satellites WHERE type = ?", (type,))
    to_delete = cur.fetchall()

    # Delete rows from the Satellites table
    delete_query = "DELETE FROM Satellites WHERE type = ?"
    cur.execute(delete_query, (type,))
    conn.commit()

    # Fetch the deleted rows
    deleted_rows = [row[1] for row in to_delete]

    print("deleted rows:")
    print(deleted_rows)
    sys.stdout.flush()

    if deleted_rows != []:
        # Delete from TLE if no remaining references
        delete_unref = """
            DELETE FROM TLE_Data
            WHERE tle_id IN ({})
            AND NOT EXISTS (
                SELECT 1 FROM Satellites
                WHERE Satellites.tle_id = TLE_Data.tle_id
            )
        """.format(','.join('?' * len(deleted_rows)))

        cur.execute(delete_unref, deleted_rows)
        conn.commit()

    # Close the cursor and the connection
    cur.close()
    conn.close()

def deleteSatelliteFromList(catnr, type):
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Delete rows from Satellites in 'type' preset.
    delete = '''
        DELETE FROM Satellites
        WHERE type = ? AND catnr = ?
    '''

    cur.execute(delete, (type, catnr))
    conn.commit()

    # Delete from TLE if no remaining references
    delete_unref = '''
        DELETE FROM TLE_Data
        WHERE catnr = ?
        AND NOT EXISTS (
            SELECT 1 FROM Satellites
            WHERE Satellites.tle_id = TLE_Data.tle_id
        )
    '''

    cur.execute(delete_unref, (catnr,))
    conn.commit()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    
def updateTLE(catnr, line1, line2, datetime):
    conn = sqlite3.connect(db_path)
    
    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Update TLE data
    sql = """
        UPDATE TLE_Data
        SET line1 = ?, line2 = ?, epoch = ?, update_time = ?
        WHERE catnr = ?    
    """

    epoch = float(line1[18:32])
    
    cur.execute(sql, (line1, line2, epoch, datetime, catnr))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def printTLE():
    conn = sqlite3.connect(db_path)

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement
    cur.execute("SELECT * FROM TLE_Data")

    # Retrieve the results
    rows = cur.fetchall()

    # Print the results
    for row in rows:
        print(row)

    # Close the cursor and the connection
    cur.close()
    conn.close()
    


