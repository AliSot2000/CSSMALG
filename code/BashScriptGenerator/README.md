# Bash Script Generator
## Table of Contents

1. [About The Generator](#about-the-generator)
   
   - [Built With](#built-with)
2. [Usage](#usage)

## About The Generator
To run our simulations as parallelized as possible we needed each simulation to run as its own job on the supercomputer.
This script writes a bash script for all the simulations given. Each executed simulation will then be placed into the job
queue and run as soon as possible.

### Built With
The Bash Script Generator was built with following languages:
- [Python](https://www.python.org/)

## Usage
To use the Bash Script Generator you need to have Python installed on your system. The script can be run with the following
command:
```bash
python3 bash_script_generator.py
```

Make sure to change the parameters of the `BashScriptGenerator()` class to your needs. The parameters are:
- `git_repo`: The path to this git repository.
- `output_root`: The path to the root directory of the output files.
- `executable`: The path to the executable file.
