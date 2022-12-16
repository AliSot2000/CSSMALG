from mongo_api import MongoAPI
from database import db_username, db_password, db_ip
import json
import os


class Ingest:
    """
    Ingester for the data into the database
    """
    def __init__(self, path_to_data: str, name: str):
        self.path_to_data = os.path.normcase(path_to_data)  # Normalize the path
        self.mongo = MongoAPI(db_ip, db_username, db_password)  # Connect to the database
        self.name = name  # Set the name of the simulation

    def ingest_simulations(self):
        simulations = get_sub_folders(os.path.join(self.path_to_data, self.name))  # Get all simulations

        if len(simulations) < 1:  # If there are no simulations
            raise Exception('No simulations found')  # Raise an exception

        for simulation in simulations:  # For each simulation
            runs = get_sub_folders(os.path.join(self.path_to_data, self.name, simulation))  # Get all runs

            for run in runs:  # For each run
                run_dir = os.path.join(self.path_to_data, self.name, simulation, run)  # Get the run directory
                print(f'Importing {simulation} {run}')  # Print the simulation and run

                agents = []  # Initialize the agents list

                sim_agents = open(os.path.join(run_dir, 'agents.json'))  # Open the agents file
                setup_agents = open(os.path.join(run_dir, 'agents.json'))  # Open the agents file

                setup_data = json.load(setup_agents)['setup']['agents']  # Load the setup data
                sim_data = json.load(sim_agents)['simulation'][0]['agents']  # Load the simulation data

                for agent in sim_data:  # For each agent in the simulation data
                    a = sim_data[agent] | {'sim_id': agent, 'travel_distance': setup_data[agent]['travel_distance'], 'type': setup_data[agent]['type']}
                    agents.append(a)  # Add the agent to the list
                    print(f' - Inserted Agent: {agent}', end='\r')  # Print the agent

                print(f' - All Agents Inserted         ')  # Spaces to overwrite the previous line

                self.mongo.insert(simulation, f'{run}_agents', agents)  # Insert the agents

                time_steps = []  # Initialize the time steps list

                for time_step in os.listdir(run_dir):  # For each time step
                    if time_step == 'agents.json':  # If the time step is the agents file
                        continue
                    if time_step == 'final.json':  # If the time step is the final file
                        continue

                    intersection_bike_flow = []  # Initialize the intersection bike flow list
                    intersection_car_flow = []  # Initialize the intersection car flow list

                    road_bike_flow = []  # Initialize the road bike flow list
                    road_car_flow = []  # Initialize the road car flow list
                    road_bike_density = []  # Initialize the road bike density list
                    road_car_density = []  # Initialize the road car density list

                    time = int(time_step.split('.')[0])  # Get the time

                    with open(os.path.join(run_dir, time_step)) as f:  # Open the time step file
                        data = json.load(f)  # Load the data

                        for intersection in data['intersections']:  # For each intersection
                            intersection_bike_flow.append(intersection['bikeFlow'])  # Add the bike flow to the list
                            intersection_car_flow.append(intersection['carFlow'])  # Add the car flow to the list
                        for road in data['streets']:  # For each road
                            road_bike_flow.append(road['bikeFlow'])  # Add the bike flow to the list
                            road_car_flow.append(road['carFlow'])  # Add the car flow to the list
                            road_bike_density.append(road['bikeDensity'] if road['bikeDensity'] is None else 0)  # Add the bike density to the list
                            road_car_density.append(road['carDensity'] if road['carDensity'] is None else 0)  # Add the car density to the list

                        time_steps.append({  # Add the time step to the list
                            'time': time,  # Add the time
                            'time_step': time_step,  # Add the time step
                            'intersection_bike_flow': intersection_bike_flow,  # Add the intersection bike flow
                            'intersection_car_flow': intersection_car_flow,  # Add the intersection car flow
                            'road_bike_flow': road_bike_flow,  # Add the road bike flow
                            'road_car_flow': road_car_flow,  # Add the road car flow
                            'road_bike_density': road_bike_density,  # Add the road bike density
                            'road_car_density': road_car_density  # Add the road car density
                        })

                        print(f' - Inserted Timestep: {time}', end='\r')  # Print the time step

                self.mongo.insert(simulation, f'{run}_timesteps', time_steps)  # Insert the time steps
                print(' - All Timesteps Inserted         ')  # Spaces to overwrite the previous line
            print('')  # Print a new line


def get_sub_folders(path):
    """
    Get all sub folders in a directory
    :param path: Path to the directory
    :return: A list of all sub folders
    """
    sub_folders = []  # Initialize the sub folders list
    for sub_folder in os.listdir(path):  # For each sub folder
        if os.path.isdir(os.path.join(path, sub_folder)):  # If the sub folder is a directory
            sub_folders.append(sub_folder)  # Add the sub folder to the list

    return sub_folders  # Return the sub folders


if __name__ == '__main__':
    i = Ingest('/var/lib/mongodb/', 'LARGE_TRAFFIC_SIG')
    i.ingest_simulations()

