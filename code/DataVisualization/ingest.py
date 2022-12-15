import mongo_api as mongo
from database import db_username, db_password, db_ip, db_name
import json
import os


class Ingest:
    def __init__(self, path_to_data: str, name: str):
        self.path_to_data = os.path.normcase(path_to_data)
        self.mongo = mongo.MongoAPI(db_username, db_password, db_ip, db_name)
        self.name = name

    def get_simulations(self):
        simulations = []
        sim_dir = os.path.join(self.path_to_data, self.name)
        for simulation in sim_dir:
            if os.path.isdir(os.path.join(sim_dir, simulation)):
                simulations.append(simulation)

        return simulations

    def combine_simulations(self):
        simulations = self.get_simulations()

        if len(simulations) < 1:
            raise Exception('No simulations found')

        for simulation in simulations:
            sim_dir = os.path.join(self.path_to_data, self.name, simulation)

            with open(os.path.join(sim_dir, 'agents.json')) as f:
                data = json.load(f)['setup']['agents']

                for agent in data:
                    a = data[agent] | {'sim_id': agent}
                    self.mongo.insert_one('agents', a)

            for time_step in os.listdir(sim_dir):
                if time_step == 'agents.json':
                    continue
                if time_step == 'final.log':
                    continue

                intersection_bike_flow = []
                intersection_car_flow = []

                road_bike_flow = []
                road_car_flow = []
                road_bike_density = []
                road_car_density = []

                time = int(time_step.split('.')[0])

                with open(os.path.join(sim_dir, time_step)) as f:
                    data = json.load(f)

                    for intersection in data['intersections']:
                        intersection_bike_flow.append(intersection['bikeFlow'])
                        intersection_car_flow.append(intersection['carFlow'])
                    for road in data['streets']:
                        road_bike_flow.append(road['bikeFlow'])
                        road_car_flow.append(road['carFlow'])
                        road_bike_density.append(road['bikeDensity'])
                        road_car_density.append(road['carDensity'])

                    self.mongo.insert_one(simulation, {
                        'time': time,
                        'time_step': time_step,
                        'intersection_bike_flow': intersection_bike_flow,
                        'intersection_car_flow': intersection_car_flow,
                        'road_bike_flow': road_bike_flow,
                        'road_car_flow': road_car_flow,
                        'road_bike_density': road_bike_density,
                        'road_car_density': road_car_density
                    })
