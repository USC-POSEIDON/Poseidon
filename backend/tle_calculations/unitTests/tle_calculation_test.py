import unittest
from unittest.mock import patch, MagicMock
from flask import Flask
from backend.tle_calculations.orbit import getPassTimeInfo, app

"""
Test suite for the TLE calculations
"""
