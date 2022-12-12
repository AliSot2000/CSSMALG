import json
import os


class Visualizer:
    path_to_data = ''
    data = []

    def __init__(self, path_to_data: str):
        self.path_to_data = os.path.normcase(path_to_data)

    def get_data(self):
        for name in os.listdir(self.path_to_data):
            if os.path.isdir(os.path.join(self.path_to_data, name)):
                self.data.append(name)

    def get_simulations(self, name: str):
        simulations = []
        sim_dir = os.path.join(self.path_to_data, name)
        for simulation in sim_dir:
            if os.path.isdir(os.path.join(sim_dir, simulation)):
                simulations.append(simulation)

        return simulations

    def combine_simulations(self, name: str):
        simulations = self.get_simulations(name)
        minutes = 0
        sim_count = len(simulations)

        if sim_count < 1:
            raise Exception('No simulations found')

        sim_dir = os.path.join(self.path_to_data, name, simulations[0])

        for file in os.listdir(sim_dir):
            if os.path.isfile(os.path.join(sim_dir, file)):
                minutes += 1

        minutes -= 1

        for simulation in simulations:
            sim_dir = os.path.join(self.path_to_data, name, simulation)

            time_steps, agent, final = sort_time_steps(os.listdir(sim_dir))

            minute = 1
            for time_step in time_steps:
                if not approx_equal(time_step, minute * 60):
                    raise Exception('Time steps are not equal')
                with open(os.path.join(sim_dir, time_step)) as f:
                    data = json.load(f)
                    # TODO: Sum the timesteps data from the simulations

                minute += 1

            with open(os.path.join(sim_dir, final)) as f:
                data = json.load(f)
                # TODO: Sum the of the final timestep from the simulations

        for minute in range(1, minutes):
            # TODO: Divide the summed data by sim_count


def approx_equal(a, b, epsilon: int = 10):
    return abs(a - b) < epsilon


def sort_time_steps(time_steps):
    new_time_steps = []
    agent_file_name = 'agents.json'
    final_file_name = 'final.json'
    for time_step in time_steps:
        if time_step == agent_file_name or time_step == final_file_name:
            continue

        new_time_steps.append(int(time_step.partition('.')[0]))
    new_time_steps.sort()
    return new_time_steps, agent_file_name, final_file_name
