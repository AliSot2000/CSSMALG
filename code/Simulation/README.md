## Running on Racklette
Required modules: slurm, cudatoolkit, cmake, gcc
export OMP_PROC_BIND=true
export OMP_PLACES=threads
export OMP_NUM_THREADS=64 # or 32