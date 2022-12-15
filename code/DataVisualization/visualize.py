from visualizer import Visualizer
import os
from mongo_api import MongoAPI
from database import db_username, db_password, db_ip


class Visualize:
    def __init__(self, output_path):
        self.mongo = MongoAPI(db_ip, db_username, db_password)
        self.visualizer = Visualizer(output_path)
        self.output_path = output_path

    def generate_all_visualizations_over_runs(self):
        simulations = self.mongo.get_databases()
        simulations.remove('admin')
        simulations.remove('config')
        simulations.remove('local')

        for simulation in simulations:
            path = os.path.join(self.output_path, simulation)
            if not os.path.exists(path):
                os.makedirs(path)
            self.visualizer.change_path(path)
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'car', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'bike', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'agent', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'car', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'bike', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'agent', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'car', 'density')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'bike', 'density')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'agent', 'density')


if __name__ == '__main__':
    output_path = '/home/jannick/Desktop/visualizations'
    visualizer = Visualize(output_path)
    visualizer.generate_all_visualizations_over_runs()