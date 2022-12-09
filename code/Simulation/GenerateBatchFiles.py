import os
import argparse


def generate_dirs(root, dirs):
    for d in dirs:
        os.makedirs(os.path.join(root, d), exist_ok=True)


def recursive_list(root_path: str, prefix: str):
    results = []
    for files in os.listdir(root_path):
        if os.path.isfile(os.path.join(root_path, files)):
            continue
        if os.path.isdir(os.path.join(root_path, files)):
            for agents in os.listdir(os.path.join(root_path, files)):
                if prefix in agents:
                    results.append(os.path.join(files, agents))
    return results


def write_bash_file(executable: str, map_in: str, car_in: str, bike_in: str, agents_in: str, stats_interval: int, output_dir: str, runtime: float, delta: float, script_dir: str, bash_file_name: str):
    file = f"""
!/bin/bash
echo "Running Simulation of {agents_in} file"
{executable} {map_in} {car_in} {bike_in} {agents_in} {stats_interval} {os.path.join(output_dir, "agents.json")} {output_dir+'/'} {runtime} {delta}
echo "Computation of {agents_in} file finished"
"""
    name = os.path.join(script_dir, f"{bash_file_name.replace('/', '-')}.sh")
    with open(os.path.join(script_dir, name), "w") as f:
        f.write(file)


def write_enqueue_file(script_dir: str, file_list: list, slurm_command: str):
    if os.path.exists(os.path.join(script_dir, "enqueue.sh")):
        os.remove(os.path.join(script_dir, "enqueue.sh"))
        print("Removed old enqueue.sh file")
    file = "!/bin/bash\n"

    for file_nama in file_list:
        name = os.path.join(script_dir, file_nama.replace("/", "-").replace(".json", ".sh"))
        file += f"{slurm_command}{os.path.join(script_dir, name)}\n"

    file += "echo \"All jobs submitted\"\n"

    with open(os.path.join(script_dir, "enqueue.sh"), "w") as f:
        f.write(file)


if __name__ == "__main__":
    # parser = argparse.ArgumentParser(description='Generate batch files for simulation')
    # parser.add_argument('--path', type=str, help='Path to the simulation folder')
    # parser.add_argument('--num', type=int, help='Number of batch files to generate')
    # args = parser.parse_args()
    # path = args.path
    # num = args.num

    # agentsDir: str = "~/CSSMALG/code/Parsing/data/"
    # agentsPrefix: str = "tiny_sim"
    # simOutDir: str = "~/CSSMALG_DATA/"
    # batchFileDir: str = "~/CSSMALG_BATCH"
    # executable_path: str = "~/CSSMALG/code/Simulation/build/Simulate"
    # map_path: str = "~/CSSMALG_DATA/tiny_map.tsim"
    # car_path: str = "~/CSSMALG_DATA/tinyCarTree.spt"
    # bike_path: str = "~/CSSMALG_DATA/tinyBikeTree.spt"

    agentsDir: str = "/home/asotoude/CSSMALG/code/Parsing/data/"
    agentsPrefix: str = "tiny_sim"
    simOutDir: str = "/home/asotoude/CSSMALG_DATA/"
    batchFileDir: str = "/home/asotoude/CSSMALG_BATCH"
    executable_path: str = "/home/asotoude/CSSMALG/code/Simulation/build/Simulate"
    map_path: str = "/home/asotoude/CSSMALG/code/Parsing/data/tinyMapExport.tsim"
    car_path: str = "/home/asotoude/CSSMALG_DATA/tinyCarTree.spt"
    bike_path: str = "/home/asotoude/CSSMALG_DATA/tinyBikeTree.spt"
    stats_interval: int = 60
    runtime = 95000
    delta = 0.25
    slurm_command = "sbatch -n 16 --wrap="

    # get all the agents
    agentsFiles = recursive_list(agentsDir, agentsPrefix)
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
                        bash_file_name=agent_dirs[i])
    print("Generated Batch Files")

    # generate enqueue file
    write_enqueue_file(script_dir=batchFileDir, file_list=agentsFiles, slurm_command=slurm_command)
    print("Done")
