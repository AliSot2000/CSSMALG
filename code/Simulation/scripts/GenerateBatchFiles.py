import os
import argparse


def generate_dirs(root, dirs):
    """
    Generate a directories from a root dir and a list of suffixes. If the directory already exists, it will be skipped.
    Function is used to create the output directories for the simulations.


    :param root: Where the output is to be stored
    :param dirs: All the directories to create in the output directory
    :return:
    """
    for d in dirs:
        os.makedirs(os.path.join(root, d), exist_ok=True)


def task_list(root_path: str, prefix: str):
    """
    Lists the files in a directory. Since we had multiple different sizes of simulations of the same map,
    the prefix allowed us to select only one of the files to generate the batch scripts  from.
    For exapmle you had full_sim, small_sim, and tiny_sim and you only wanted to create scripts for full_sim, you would
    pass in "full_sim" as the prefix.

    :param root_path: directory to start listing from
    :param prefix: prefix to only include files matching it.
    :return:
    """
    results = []
    for files in os.listdir(root_path):
        if os.path.isfile(os.path.join(root_path, files)):
            continue
        if os.path.isdir(os.path.join(root_path, files)):
            for agents in os.listdir(os.path.join(root_path, files)):
                if prefix in agents:
                    results.append(os.path.join(files, agents))
    return results


def write_bash_file(executable: str, map_in: str, car_in: str, bike_in: str, agents_in: str, stats_interval: int,
                    output_dir: str, runtime: float, delta: float, script_dir: str, bash_file_name: str,
                    traffic_sig: bool):
    """
    Function to write the bash file for the execution of a single simulation. These batch files are then submitted to
    the cluster with sbatch.

    :param executable: Path to executable i.e. path/to/Simulate
    :param map_in: Path to map i.e. path/to/map.tsim
    :param car_in: Path to precomputed car shortest path tree i.e. path/to/car.spt
    :param bike_in: Path to precomputed bike shortest path tree i.e. path/to/bike.spt
    :param agents_in: Path to the precomputed random agents i.e. path/to/agents.json
    :param stats_interval: Interval at which to log the statistics to a json file in seconds simulation time. i.e. 600
    :param output_dir: Directory to store the stats in i.e. path/to/output
    :param runtime: Number of seconds to run the simulation time for i.e. 86400 so a day.
    :param delta: Time increments in which the simulation is calculated. We used 0.25s
    :param script_dir: Directory to output the scripts to i.e. path/to/scripts
    :param bash_file_name: The name to give to this new file. i.e. "0percentBikes_full_sim-1.sh"
    :param traffic_sig: Weather or not the simulation should use traffic signals. i.e. True
    :return:
    """

    tsig = 1 if traffic_sig else 0
    file = f"""
#!/bin/bash
echo "Running Simulation of {agents_in} file"
{executable} {map_in} {car_in} {bike_in} {agents_in} {stats_interval} {os.path.join(output_dir, "agents.json")} {output_dir+'/'} {runtime} {delta} {tsig}
echo "Computation of {agents_in} file finished"
"""
    name = os.path.join(script_dir, f"{bash_file_name.replace('/', '-')}.sh")
    with open(os.path.join(script_dir, name), "w") as f:
        f.write(file)


def write_enqueue_file(script_dir: str, file_list: list, slurm_command: str):
    """
    Writes a script to enqueue the previously written scripts in slurm.
    :param script_dir:
    :param file_list:
    :param slurm_command:
    :return:
    """
    if os.path.exists(os.path.join(script_dir, "enqueue.sh")):
        os.remove(os.path.join(script_dir, "enqueue.sh"))
        print("Removed old enqueue.sh file")
    file = "#!/bin/bash\n"

    for file_nama in file_list:
        name = os.path.join(script_dir, file_nama.replace("/", "-").replace(".json", ".sh"))
        file += f"{slurm_command}{os.path.join(script_dir, name)}\n"

    file += "echo \"All jobs submitted\"\n"

    with open(os.path.join(script_dir, "enqueue.sh"), "w") as f:
        f.write(file)


if __name__ == "__main__":
    # Argparsing to make the it easyer for this script to interface with bash scripts.
    parser = argparse.ArgumentParser(description='Generate batch files for simulation. This script is '
                                                 'intended to run with SLURM.')
    parser.add_argument('-e', '--executable', type=str, help='Path to the executable', required=True)
    parser.add_argument('-m', '--map', type=str, help='Path to the map (.tsim file) file', required=True)
    parser.add_argument('-c', '--carSPT', type=str, help='Path to the car (.spt file) file', required=True)
    parser.add_argument('-b', '--bikeSPT', type=str, help='Path to the bike (.spt file) file', required=True)
    parser.add_argument('-a', '--agents', type=str, help='Path to the pre-generated agents file (.json file) file',
                        required=True)
    parser.add_argument('-p', '--agentPrefix', type=str, help='Set the prefix for the agent. The agents directory might '
                                                              'contain agents for different simulation. Should be unique '
                                                              'in folder. if "full_sim_X.json" and "tiny_sim_X.json" are '
                                                              'available, a suitable prefix would be full_sim_"', required=True)
    parser.add_argument('-o', '--output', type=str, help='Set the root output directory for the simulations', required=True)
    parser.add_argument('-s', '--batchDir', type=str, help='Set the directory where the generated shell files are going '
                                                           'to be stored', required=True)
    parser.add_argument('-i', '--statsInterval', type=int, help='Set the interval for the stats output', required=False,
                        default=600)
    parser.add_argument('-r', '--runtime', type=float, help='Set the runtime for the simulation', required=False,
                        default=100000)
    parser.add_argument('-d', '--delta', type=float, help='Set the time step size for the simulation', required=False,
                        default=0.25)
    parser.add_argument('-t', '--slurmCommand', type=str, help='Set the slurm command for the simulation', required=False, default="sbatch -n 16 --wrap=")
    parser.add_argument('-f', '--trafficSignal', type=bool, help='Set the traffic signal flag for the simulation', required=False, default=False)

    args = parser.parse_args()

    executable_path: str = args.executable

    map_path: str = args.map
    bike_path: str = args.bikeSPT
    car_path: str = args.carSPT

    agentsDir: str = args.agents
    agentsPrefix: str = args.agentPrefix

    simOutDir: str = args.output
    batchFileDir: str = args.batchDir

    stats_interval: int = args.statsInterval
    runtime: float = args.runtime
    delta: float = args.delta
    slurm_command: str = args.slurmCommand

    traffic_sig: bool = args.trafficSignal

    # get all the agents
    agentsFiles = task_list(agentsDir, agentsPrefix)
    agent_dirs = []
    print("Found {} agents".format(len(agentsFiles)))

    for af in agentsFiles:
        # remove file extension
        agent_dirs.append(os.path.splitext(af)[0])

    # generate the directories
    generate_dirs(simOutDir, agent_dirs)
    print("Generated Dirs")

    # generate the batch files
    os.makedirs(batchFileDir, exist_ok=True)

    # generate batch files
    for i in range(len(agentsFiles)):
        write_bash_file(executable=executable_path,
                        map_in=map_path,
                        car_in=car_path,
                        bike_in=bike_path,
                        agents_in=os.path.join(agentsDir, agentsFiles[i]),
                        stats_interval=stats_interval,
                        output_dir=os.path.join(simOutDir, agent_dirs[i]),
                        runtime=runtime,
                        delta=delta,
                        script_dir=batchFileDir,
                        bash_file_name=agent_dirs[i],
                        traffic_sig=traffic_sig)
    print("Generated Batch Files")

    # generate enqueue file
    write_enqueue_file(script_dir=batchFileDir, file_list=agentsFiles, slurm_command=slurm_command)
    print("Done")
