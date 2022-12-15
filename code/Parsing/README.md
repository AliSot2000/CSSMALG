# Parsing
## Table of Contents

1. [About The Parser](#about-the-parser)
    - [General](#general)
    - [Assumptions](#assumptions)
2. [Code Structure](#code-structure)
    - [Parser](#parser)
    - [AgentGenerator](#agentgenerator)
    - [main](#main)

## About the Parser
### General

The `Parser.php` is here to generate data for the simulation. With an API request using Overpass API we retrieve data from OSM. It gets parsed and cleaned. Afterwards it gets saved to `mapExport.tsim` in the data folder. The JSON is formatted according to the specifications in `map-input-json-spec.md`. 
The data directory is not included due to the size of the generated data. However it is generated when `main-php` is run. The file is run with PHP 8.1.

After generating the map data, `AgentGenerator.php` is called and generates different agent files to run on this map based on a few assumptions noted in [Assumptions](#assumptions). In the `data` directory, there are several subdirectories where data is stored. For more on this, see [Code Structure](#code-structure). The generated files follow the format given in  `agents-input-json-spec.md`.

### Assumptions
- Assumption Regarding Agent Generation: 
    - At a maximum, there will be one vehicle spawned per hour per $4000 m^2$ of the map. This can be changed by adjusting the value $4000$ in `AgentGenerator.php` in the `calculateAgentAmount()` method
    - In the `calculateAgentAmount()` method in the `AgentGenerator.php` class there is an array `agentDistribution`, which contains the distribution of amount cars spawned. The value of entry $i$ means, that $maxAgentAmount \cdot agentDistribution[i]$ cars are spawned between $i$ and $(i+1)$ o'clock. This distribution is based on [Autofahren im Kanton Zürich](https://www.web.statistik.zh.ch/ogd/daten/ressourcen/KTZH_00000266_00001307.pdf) Grafik 9.
    - In the `direction` array in the `generateAgents()` method of `AgentGenerator.php` class, we save the relative amount of agents for each hour, that goes into the center of the city. Here we assume, that a circle with $\frac{1}{3}$ radius of the map is the center, where most people work. Of the people going into the center, $\frac{1}{4}$ is assumed to be center $\leftrightarrow$ center traffic, where as of the res $\frac{1}{4}$ is non-center $\leftrightarrow$ non-center traffic.
    - Public transport is ignored

## Code Structure
### Parser

The Parser is located in the `src` directory. It sends following request to the Overpass API and retrieves raw OSM data. `South, West, North, East` are the bounding coordinates of the box, from which data shall be retrieved from. It can be declared in the `main.php` file. 

            [out:json]
            [bbox:South,West,North,East];
            (
                way[highway=primary];
                way[highway=secondary];
                way[highway=trunk];
                way[highway=tertiary];
                way[highway=service];
                way[highway=residential];
            )->.a;
            (.a;>;);
            out;
            
The results of cleaning and generating the data according to specifications of `map-input-json-spec.md` is saved in `mapExport.tsim` in JSON format into the `data` directory.

### AgentGenerator

From the given coordinates, the AgentGenerator computes the center of the map and the radius of the "center-circle". It checks which intersections in `mapExport.tsim` are in the center and which are not. It then generates different agent files and saves them into the `data` directory. For each entry in the `bikePercentages` array, it generates 10 agent files, where `bikePercentages[i]` percent of agents are bikes. All agent files are generated according to the standard in `agents-input-json-spec.md`. All agent files with the same amount of bike percentage x is saved into the subdirectory `data/xpercent_bikes`.
In the directory `data/reachability` one can insert reachability-files. These are JSON files including node pairs, which are not reachable from each other from bike or car. If not given, we assume all node pairs are reachable from each other. 


### Main

The file `main.php` in the `src` folder contains a PHP script, creating a Parser and AgentGenerator object. In the constructor of those the coordinate boundaries of the map are given. The order of the coordinates needs to be `West, East, South, North`.  Both pairs of coordinates in the constructors must be the same.

This script can be run.
