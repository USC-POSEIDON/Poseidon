import psycopg2
from datetime import datetime, timedelta
from configparser import ConfigParser

params: dict

def getLogin(filename='backend/database.ini'):
    parser = ConfigParser()
    parser.read(filename)
    global params 
    params = dict(parser.items('postgresql'))

def createTables():
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Drop tables
    cur.execute("""
        DROP TABLE IF EXISTS Satellites, TLE_Data, Satellite_Passes;
    """)

    conn.commit()

    # Create tables
    cur.execute("""
        CREATE TABLE IF NOT EXISTS TLE_Data (
            tle_id SERIAL PRIMARY KEY,
            catnr INT,
            line1 VARCHAR(69),
            line2 VARCHAR(69),
            epoch DECIMAL,
            unique(catnr)
        );         
    """)
    
    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS Satellites (
            satellite_id SERIAL PRIMARY KEY,
            tle_id INT REFERENCES TLE_Data(tle_id),
            catnr INT,
            name VARCHAR(255),
            type VARCHAR(100),
            unique(catnr, type)
        );
    """)

    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS Satellite_Passes (
            pass_id SERIAL PRIMARY KEY,
            satellite_id INT REFERENCES Satellites(satellite_id),
            time TIMESTAMP,
            azm DECIMAL,
            elv DECIMAL,
            range DECIMAL
        );
    """)

    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def insertSatellite(tle_id, catnr, name, type):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT INTO Satellites (
        tle_id, catnr, name, type
    ) VALUES (%s, %s, %s, %s)
    ON CONFLICT (catnr, type) DO NOTHING
    """

    cur.execute(sql, (tle_id, catnr, name, type))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

    # TODO: return something so frontend knows if repeated addition

def insertTLE(catnr, line1, line2):
    epoch = float(line1[18:32])
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT INTO TLE_Data (
        catnr, line1, line2, epoch
    ) VALUES (%s, %s, %s, %s)
    ON CONFLICT (catnr) DO NOTHING;
    """

    cur.execute(sql, (catnr, line1, line2, epoch))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def insertPass(satellite_id, time, azm, elv, range):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Insert parsed data into the database
    sql = """
    INSERT INTO Satellite_Passes (
        satellite_id, time, azm, elv, range
    ) VALUES (%s, %s, %s, %s, %s)
    """

    cur.execute(sql, (satellite_id, time, azm, elv, range))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def getSatelliteID(catnr):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement
    cur.execute("SELECT tle_id FROM TLE_Data WHERE catnr = %s", (catnr,))

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
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432
                            
    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Prepare the SQL query with JOIN to link Satellite_Passes to the Satellites table using the satellite name
    query = """
    SELECT Satellite_Passes.*
    FROM Satellite_Passes
    JOIN Satellites ON Satellite_Passes.satellite_id = Satellites.satellite_id
    WHERE Satellites.name = %s;
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
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Prepare the SQL query to join Satellite_Passes with Satellites and select passes by satellite name
    query = """
    SELECT Satellite_Passes.*
    FROM Satellite_Passes
    INNER JOIN Satellites ON Satellite_Passes.satellite_id = Satellites.satellite_id
    WHERE Satellites.name = %s;
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
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement
    cur.execute("SELECT catnr FROM TLE_Data")

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
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    query = """
    SELECT Satellites.catnr, Satellites.name, TLE_Data.line1, TLE_Data.line2 
    FROM Satellites
    JOIN TLE_Data ON Satellites.tle_id = TLE_Data.tle_id
    WHERE type = %s;
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
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Execute a SELECT statement
    cur.execute("SELECT * FROM tle_data")

    # Retrieve the results
    rows = cur.fetchall()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    return rows
    
def deletePresetList(type):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Delete rows from Satellites in 'type' preset.
    delete = '''DELETE FROM Satellites
    WHERE type=%s 
    RETURNING tle_id;'''

    cur.execute(delete, (type,))
    conn.commit()

    # Fetch the deleted rows
    deleted_rows = [row[0] for row in cur.fetchall()]

    # Delete from TLE if no remaining references
    delete_unref = '''DELETE FROM TLE_Data
    WHERE tle_id = ANY(%s)
    AND NOT EXISTS (
        SELECT 1 FROM Satellites
        WHERE Satellites.tle_id = TLE_Data.tle_id
    );'''

    cur.execute(delete_unref, (deleted_rows,))
    conn.commit()

    # Close the cursor and the connection
    cur.close()
    conn.close()

def deleteSatelliteFromList(catnr, type):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Delete rows from Satellites in 'type' preset.
    delete = '''DELETE FROM Satellites
    WHERE type=%s AND catnr=%s 
    RETURNING *;'''

    cur.execute(delete, (type, catnr))
    conn.commit()

    # Delete from TLE if no remaining references
    delete_unref = '''DELETE FROM TLE_Data
    WHERE catnr=%s
    AND NOT EXISTS (
        SELECT 1 FROM Satellites
        WHERE Satellites.tle_id = TLE_Data.tle_id
    );'''

    cur.execute(delete_unref, (catnr,))
    conn.commit()

    # Close the cursor and the connection
    cur.close()
    conn.close()

    
def updateTLE(catnr, line1, line2):
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432
    
    # Open a cursor to perform database operations
    cur = conn.cursor()

    # Update TLE data
    sql = """
    UPDATE TLE_Data
    SET line1 = %s, line2 = %s, epoch = %s 
    WHERE catnr = %s;    
    """

    epoch = float(line1[18:32])
    cur.execute(sql, (line1, line2, epoch, catnr))
    conn.commit()

    # Close the connection
    cur.close()
    conn.close()

def printTLE():
    conn = psycopg2.connect(database=params.get('database'), # database is the name of the database on local postgresql 
                            host="localhost", # host is the name of the host on local postgresql, usually localhost
                            user=params.get('user'), # user is the name of the user on local postgresql, whatever you named it
                            password=params.get('password'), # password is the password of the user on local postgresql
                            port="5432") # port is the port number of the local postgresql, usually 5432

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
    


