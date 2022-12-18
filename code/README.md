# Code
## Table of Contents

1. [MapCreation](#mapcreation)
2. [Simulation](#simulation)
3. [Parsing](#parsing)

## MapCreation
The Graphical User Interface for:
- Viewing a simulation
- Creating a map
- Editing a map

## Simulation
The simulation of a map. Maps created by the GUI can be exported and viewed again in the GUI.

## Parser
Data parser to parse the raw OSM data and generate agents for the map.


## Running on Racklette
slurm, cudatoolkit, cmake, gcc, cmake
export OMP_PROC_BIND=true
export OMP_PLACES=threads
export OMP_NUM_THREADS=16 # or 32
