# Data Visualization
## Table of Contents

1. [About The Visualization](#about-the-visulization)
   - [Built With](#built-with)
2. [Usage](#usage)

## About The Visualization
To visualize the data from the simulations we used the [MathPlotLib](https://matplotlib.org/) library. The data is read from the output files, stored in a database and plotted with the help of the library.

### Built With
The Data Visualization was built with following languages:
- [Python](https://www.python.org/)

## Usage
Make sure you have set up a mongodb. If you haven't read the setup steps in the [setup_mongo.md](./setup_mongo.md) file.

Don't forget to change the mongodb ip, port, username and password in the `database.py` file.

To ingest all the data into the database you need to run the following script: (Change parameters to paths for your system)
```bash
python3 ingest.py
```

To visualize the data you need to run the following script: (Change parameters to paths for your system)
```bash
python3 visualize.py
```