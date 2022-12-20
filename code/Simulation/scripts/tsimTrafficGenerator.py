import json
import os
import argparse
import random
import datetime
from typing import Union


class RAG:
    """
    Semi random agent generator.
    It expands on the capabilities of the GenerateAgents executable.

    The class uses a uniform distribution to generate random values for the agent properties.
    Additionally, the number of agents starting in a hour can be specified.

    The class then generates a set of agents for different simulations.
    The number of bikes can vary across the simulation by percentages and the number of times a certain percentage
    is generated can be specified as well to generate stochasticity.
    """

    def __init__(self, map_in: str, reachability_in: str, agents_out: str):
        """
        Init function

        :param map_in: map to use
        :param reachability_in: reachability of the intersection of the map
        :param agents_out: output direcotory for agents.
        """
        self.map_in = map_in
        self.reachability_in = reachability_in
        self.agents_out = agents_out

        self.map = None
        self.reachability = None
        self.default_pattern = [1, 1, 1, 1, 1, 2, 5, 7, 4, 4, 4, 4, 5, 5, 4, 4, 4, 7, 7, 3, 3, 2, 1, 1]

        # parameters for bikes and cars. Not private so can be modified when using the class
        self.bike_length = {"min": 1.5, "max": 2.5}
        self.bike_max_velocity = {"min": 10, "max": 35}
        self.bike_acceleration = {"min": 0.5, "max": 1.5}
        self.bike_deceleration = {"min": 1.0, "max": 3.0}
        self.bike_acceleration_exponent = {"min": 8.0, "max": 12.0}

        self.car_length = {"min": 4.5, "max": 5.5}
        self.car_max_velocity = {"min": 100, "max": 250}
        self.car_acceleration = {"min": 1.5, "max": 5.0}
        self.car_deceleration = {"min": 2.0, "max": 8.0}
        self.car_acceleration_exponent = {"min": 8.0, "max": 12.0}

        # ratio of bikes in to use accross the simulations
        self.start_ratio = 0
        self.end_ratio = 20
        self.step_size = 1
        self.sim_prefix = "test"

    def generate_agent(self, start_id: str, end_id: str, car: bool):
        """
        Genrates a single agent dict
        :param start_id: start intersection id
        :param end_id: end intersection id
        :param car: if the agent is a car or not
        :return: dict with the agent properties
        """
        if car:
            length = random.uniform(self.car_length["min"], self.car_length["max"])
            max_velocity = random.uniform(self.car_max_velocity["min"], self.car_max_velocity["max"])
            acceleration = random.uniform(self.car_acceleration["min"], self.car_acceleration["max"])
            deceleration = random.uniform(self.car_deceleration["min"], self.car_deceleration["max"])
            acceleration_exponent = random.uniform(self.car_acceleration_exponent["min"],
                                                   self.car_acceleration_exponent["max"])
        else:
            length = random.uniform(self.bike_length["min"], self.bike_length["max"])
            max_velocity = random.uniform(self.bike_max_velocity["min"], self.bike_max_velocity["max"])
            acceleration = random.uniform(self.bike_acceleration["min"], self.bike_acceleration["max"])
            deceleration = random.uniform(self.bike_deceleration["min"], self.bike_deceleration["max"])
            acceleration_exponent = random.uniform(self.bike_acceleration_exponent["min"],
                                                   self.bike_acceleration_exponent["max"])

        return {"start_id": start_id,
                "end_id": end_id,
                "length": length,
                "max_velocity": max_velocity,
                "acceleration": acceleration,
                "deceleration": deceleration,
                "acceleration_exponent": acceleration_exponent,
                "waiting_period": 0.0}

    def load_data(self):
        """
        Load the map and reachability data
        :return:
        """
        with open(self.map_in, "r") as f:
            self.map = json.load(f)
        with open(self.reachability_in, "r") as f:
            self.reachability = json.load(f)

    def write_agents_file(self, percent: int, retrials: int, cars: dict, bikes: dict):
        """
        Write the agents file for a given percentage of bikes to disk
        :param percent: percent of bikes
        :param retrials: the iteration of this files (for stochasticity)
        :param cars: dict of cars
        :param bikes: dict of bikes
        :return:
        """
        data = {"cars": cars, "bikes": bikes}

        # path like /path/to/output/prefix_10/prefix_0_agents.json
        with open(os.path.join(self.agents_out, f"{self.sim_prefix}_{percent}",
                               f"{self.sim_prefix}_{retrials:02d}.json"), "w") as f:
            json.dump(data, f)

    def build_dirs(self, start_ratio: int, end_ratio: int, step_size: int, prefix: str):
        """
        Build directories for the different batches of simulations with different percentages of bikes
        :param start_ratio: Starting percentage of bikes
        :param end_ratio: End percentage of bikes
        :param step_size: step by which to increase the percentage of bikes
        :param prefix: prefix to add to the agents.json file
        :return:
        """
        self.start_ratio = start_ratio
        self.end_ratio = end_ratio
        self.step_size = step_size
        self.sim_prefix = prefix

        for i in range(start_ratio, end_ratio + 1, step_size):
            os.makedirs(os.path.join(self.agents_out, f"{prefix}_{i}"), exist_ok=True)

    def make_random_agents(self, num_agents: int, seed: int = None, retrials: int = 10,
                           traffic_pattern: Union[list, bool] = True):
        """
        Make the full set of random agents

        Traffic pattern:
        List of length 24 containing integers. The integers represent the relative number of cars at the the given hour
        of the day. The number of agents in a given hour are calculated by sum(traffic_pattern) * traffic_pattern[hour]
        If false, the number of agents across the hours is uniform. If true, the default pattern is used in the
        traffic_pattern variable.

        :param num_agents: Number of agents in every simulation
        :param seed: Seed for the Random number generator
        :param retrials: number of time to iterations for each agent percentage for stochasticity
        :param traffic_pattern: may contain a list of length 24 which indicates the traffic pattern
        :return:
        """
        random.seed(datetime.datetime.now().ctime())
        if seed is not None:
            random.seed(seed)

        intersections = [intersection["id"] for intersection in self.map["intersections"]]
        car_reachability: dict = self.reachability["carTree"]
        bike_reachability: dict = self.reachability["bikeTree"]

        if traffic_pattern is True:
            traffic_pattern = self.default_pattern
        elif traffic_pattern is False:
            traffic_pattern = [1 for _ in range(24)]
        elif type(traffic_pattern) is list:
            if len(traffic_pattern) != 24:
                raise Exception("Traffic pattern must be a list of length 24")

        div = 0
        for i in traffic_pattern:
            div += i

        for p in range(self.start_ratio, self.end_ratio + 1, self.step_size):
            for r in range(retrials):
                # initialize agents dicts
                cars = {}
                bikes = {}

                # integer used for the id of the agent
                id_int = 0

                for h in range(24):
                    # calculate number of agents to generate in a given hour
                    total_agents_of_hour = int(num_agents * traffic_pattern[h] / div)
                    cars_of_hour = int(total_agents_of_hour * (100 - p / 100))
                    bikes_of_hour = total_agents_of_hour - cars_of_hour

                    # generate cars
                    for _ in range(cars_of_hour):
                        valid_path = False
                        safety_counter = 0

                        # try 1000 times to find a valid path
                        while not valid_path and safety_counter < 1000:
                            start = random.choice(intersections)
                            end = random.choice(intersections)

                            valid_path = car_reachability[start].get(end) is None or car_reachability[start].get(end) is True
                            safety_counter += 1

                        # path was valid, add the agent to the dict
                        if valid_path:
                            car = self.generate_agent(start, end, True)
                            car["waiting_period"] = random.uniform(float(h * 3600), float((h+1) * 3600))
                            cars[f"{id_int}"] = car
                            id_int += 1

                    # generate bikes
                    for _ in range(bikes_of_hour):
                        valid_path = False
                        safety_counter = 0

                        # try 1000 times to find a valid path
                        while not valid_path and safety_counter < 1000:
                            start = random.choice(intersections)
                            end = random.choice(intersections)

                            valid_path = bike_reachability[start].get(end) is None or bike_reachability[start].get(end) is True
                            safety_counter += 1

                        # path was valid, add the agent to the dict
                        if valid_path:
                            bike = self.generate_agent(start, end, False)
                            bike["waiting_period"] = random.uniform(float(h * 3600), float((h+1) * 3600))
                            bikes[f"{id_int}"] = bike
                            id_int += 1

                print(f"Writing {p:02}% Bikes, Run {r:02} to Disk")
                self.write_agents_file(p, r, cars, bikes)


if __name__ == "__main__":
    # Argparse for easier use with bash scripts
    parser = argparse.ArgumentParser(description='Generate random Agents for the Simulation. This script uses a .tsim '
                                                 'file for the map to generate the agents.')
    parser.add_argument('-m', '--map', type=str, help='Path to the map (.tsim file) file', required=True)
    parser.add_argument('-r', '--reachability', type=str, help='Path to the reachability file', required=True)
    parser.add_argument('-o', '--output', type=str, help='Path to the output directory', required=True)
    parser.add_argument('-n', '--number', type=int, help='Number of agents to generate', default=20000)

    # TODO Add arguments for all ranges from which the properties of the agents are selected.

    args = parser.parse_args()
    map_path = args.map
    reachability_path = args.reachability
    output_dir = args.output

    generator = RAG(map_path, reachability_path, output_dir)
    generator.load_data()
    generator.build_dirs(0, 20, 2, "rep")
    generator.make_random_agents(num_agents=args.number)

