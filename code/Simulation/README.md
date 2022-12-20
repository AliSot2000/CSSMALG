# Simulation
## Table of Contents

1. [Include Directory](#include)
2. [Scripts Directory](#scripts)
3. [Specification directory](#specs)
4. [Source Directory](#src)
5. [Hints for HPC Cluster](#running-on-racklette)

## include
Header files of the files that are shared among the executables in the simulation.

## scripts
A bunch of python scripts used during the development of the simulation. Some are used for debugging, some are used 
for statistics and some are for file generation.

## specs
Contains a bunch of markdown files that describe the file format in which data has to be passed into and out of the 
simulation.

## src
Contains the source c++ and cuda code of the simulation.


### Running on Racklette
Required modules: slurm, cudatoolkit, cmake, gcc

Commands to run:
```bash
export OMP_PROC_BIND=true
export OMP_PLACES=threads
export OMP_NUM_THREADS=64 # or 32
```