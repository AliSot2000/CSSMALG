from visualizer import Visualizer
import os
from mongo_api import MongoAPI
from database import db_username, db_password, db_ip


class Visualize:
    """
    Visualize the data we didn't want but the data we needed. -Lt. James Gordon
    """
    def __init__(self, output_path):
        """
        Initialize the visualizer.
        :param output_path:
        """
        self.mongo = MongoAPI(db_ip, db_username, db_password)  # Connect to the database
        self.visualizer = Visualizer(output_path)  # Initialize the visualizer
        self.output_path = output_path  # Set the output path

    def generate_all_visualizations_over_runs(self):
        """
        Generate all visualizations over runs.
        :return:
        """
        simulations = self.mongo.get_databases()  # Get all simulations
        simulations.remove('admin')  # Remove the admin database
        simulations.remove('config')  # Remove the config database
        simulations.remove('local')  # Remove the local database

        for simulation in simulations:  # For each simulation
            path = os.path.join(self.output_path, simulation)  # Set the path
            if not os.path.exists(path):  # If the path doesn't exist
                os.makedirs(path)  # Make the path
            self.visualizer.change_path(path)  # Change the path

            # Visualize the data
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'car', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'bike', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'intersection', 'agent', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'car', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'bike', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'agent', 'flow')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'car', 'density')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'bike', 'density')
            self.visualizer.visualize_over_different_runs(simulation, 'road', 'agent', 'density')

            self.visualizer.visualize_seperated_agents(simulation, 'intersection', 'flow')
            self.visualizer.visualize_seperated_agents(simulation, 'road', 'flow')
            self.visualizer.visualize_seperated_agents(simulation, 'road', 'density')

        # Visualize the data for all simulations
        self.visualizer.change_path(self.output_path)
        self.visualizer.visualize_avg_speed_multiple_sims(simulations, 'car')
        self.visualizer.visualize_avg_speed_multiple_sims(simulations, 'bike')
        self.visualizer.visualize_avg_speed_multiple_sims(simulations, 'agent')


if __name__ == '__main__':
    output_path = '/home/jannick/Desktop/visualizations'  # Set the output path
    visualizer = Visualize(output_path)  # Initialize the visualizer
    visualizer.generate_all_visualizations_over_runs()  # Generate all visualizations over runs