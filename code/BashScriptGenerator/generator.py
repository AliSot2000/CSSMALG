import os


class BashScriptGenerator:
    """
    A class to generate a bash script to run all the simulations. This is done as the super computer will split the jobs
    up into smaller jobs and run them in parallel. This is done by creating a bash script that will run all the
    simulations. Each simulation will be run seperately and the output will be stored in a folder with the name of the
    percentage of agents that are cyclists. The output will also be stored in a folder with the name of the simulation
    number. This is so that the output can be easily found and analysed.
    """
    def __init__(self, git_repo: str = '../../',
                 output_root: str = '/other/sim_out',
                 executable: str = '/code/build/simulation'):
        """
        The init function. It will sanitise the input and generate all the required paths.

        :param git_repo:  The git repo path. This is used to find the input files.
        :param output_root: The relative path to the output root. This is where the output will be stored.
        :param executable: The relative path to the executable. This is the path to the simulation executable.
        """

        if not dir_exists(git_repo):
            raise Exception(f'The folder: "{git_repo}" does not exist')
        self.git_repo = sanitise_path(git_repo)

        if not dir_exists(output_root):
            raise Exception(f'The folder: "{output_root}" does not exist')
        self.output_root = os.path.join(git_repo, os.path.normcase(output_root))

        if not file_exists(executable):
            raise Exception(f'The file: "{executable}" does not exist')
        self.executable = os.path.join(git_repo, os.path.normcase(executable))

        # The Map File
        self.map_in = os.path.join(self.git_repo, os.path.normcase('code/Parsing/data/mapExport.tsim'))

        # The Car Path Finding Tree
        self.car_in = os.path.join(self.output_root, os.path.normcase('carTree.spt'))

        # The Bike Path Finding Tree
        self.bike_in = os.path.join(self.output_root, os.path.normcase('bikeTree.spt'))

        # The Status Log Interval
        self.status_log_interval = 60

        # The Simulation Time in Time Steps
        self.sim_time = 95000

        # How many times per time step the simulation will output calculate the new positions of the agents
        self.time_step = 0.25

    def generate_bash_script(self):
        """
        This function will generate the bash script. It will create a bash script that will run all the simulations.
        :return:
        """
        # Directory with all the simulations in them
        percentages = os.path.join(self.output_root, os.path.normcase('/code/Parsing/data/'))

        # All the files in the directory
        files = os.listdir(percentages)

        # The bash script
        shell = os.path.join(self.output_root, os.path.normcase('run.sh'))

        # Create/Overwrite the bash script
        f = open(shell, 'w')

        # Write the header
        f.write('# !/bin/bash\n')

        # For all the files in the directory
        for name in files:
            # Check if the file is a directory
            if not dir_exists(os.path.join(percentages, name)):
                continue

            # For all the simulations in the directory
            for i in range(10):
                f.write(f'#{name} sim_{i}\n'  # Write the name of the simulation
                        f'{self.generate_command(name, i)}\n\n')  # Write the command to run the simulation

        f.close()
        print(f'Bash Script Generated under {shell}')

    def generate_command(self, name: str, number: int):
        """
        This function will generate the command to run the simulation.
        :param name: Name of the simulation directory
        :param number: Number of the simulation
        :return:
        """
        agents_in = os.path.join(self.git_repo, os.path.normcase(f'/code/Parsing/data/{name}/sim_{number}.json'))
        output_dir = os.path.join(self.output_root, os.path.normcase(f'/{name}_sim_{number}'))
        os.mkdir(output_dir)
        output_agents = os.path.join(output_dir, f'/agents.json')
        return f'{self.executable} {self.map_in} {self.car_in} {self.bike_in} {agents_in} {self.status_log_interval} ' \
               f'{output_dir} {output_agents} {self.sim_time} {self.time_step}'


def sanitise_path(path: str):
    """
    Sanizes the path. The path will be made absolute and all the slashes will be replaced with the correct slash for the
    operating system.
    :param path: The path to sanitize
    :return:
    """
    path = os.path.normcase(path)
    if os.path.isabs(path):
        path = os.path.join(os.path.realpath(os.path.dirname(__file__)), path)
    return path


def dir_exists(path: str):
    """
    Checks if the directory exists and is actually a directory.
    :param path: The path to check
    :return:
    """
    return os.path.exists(path) and os.path.isdir(path)


def file_exists(path: str):
    """
    Checks if the file exists and is actually a file.
    :param path: The path to check
    :return:
    """
    return os.path.exists(path) and os.path.isfile(path)


if __name__ == '__main__':
    gen = BashScriptGenerator()
    gen.generate_bash_script()
