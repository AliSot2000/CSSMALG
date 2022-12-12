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

        if len(simulations) < 1:
            return

        sim_dir = os.path.join(self.path_to_data, name, simulations[0])

        for file in os.listdir(sim_dir):
            if os.path.isfile(os.path.join(sim_dir, file)):
                minutes += 1

        minutes -= 1

