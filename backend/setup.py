from setuptools import setup

setup(
    name='tle_calculations',
    packages=['tle_calculations'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_cors',
        'sgp4',
        'scipy',
        'requests',
        'skyfield',
        'setuptools',
        'waitress',
        'python-dateutil'
    ],
)