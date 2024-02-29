# TLE + Orbital Propagation

A Python Flask app is used to allow API calls from the Electron app for TLE retrieval and orbital propagation calculation functionalities. TLE retrieval includes getting TLE data from CelesTrak and inserting/retrieving from a local Postgres database. Orbital propagation involes real-time calculation of telemetry data satellite and pass time predictions.   

## Dependencies

Python dependencies in the Flask App:

- flask
- scipy
- sgp4
- psycopg2
- requests
- skyfield

From backend directory:
```
pip install -e .
```

## Setting Up Postgres

Install [PostgreSQL](https://www.postgresql.org/download/).

Create a table called `poseidon`:

```psql
psql -U <user>              # default user is 'postgres'
Password for user <user>:   # enter password
CREATE DATABASE poseidon;   # create database
```

Update information in `database.ini` if necessary.