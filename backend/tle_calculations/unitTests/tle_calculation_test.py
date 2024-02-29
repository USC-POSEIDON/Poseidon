import unittest
from unittest.mock import patch, MagicMock
from flask import Flask
from tle_calculations.orbit_calculations import getPassTimeInfo, app

"""
Test suite for the TLE calculations
"""
