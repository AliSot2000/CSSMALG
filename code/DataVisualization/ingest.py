from mongo_api import MongoAPI
from database import db_username, db_password, db_ip
import json
import os


class Ingest:
    def __init__(self, path_to_data: str, name: str):
        self.path_to_data = os.path.normcase(path_to_data)
        self.mongo = MongoAPI(db_ip, db_username, db_password)
        self.name = name

    def ingest_simulations(self):
        simulations = get_sub_folders(os.path.join(self.path_to_data, self.name))

        if len(simulations) < 1:
            raise Exception('No simulations found')

        for simulation in simulations:
            runs = get_sub_folders(os.path.join(self.path_to_data, self.name, simulation))

            for run in runs:
                run_dir = os.path.join(self.path_to_data, self.name, simulation, run)
                print(f'Importing {simulation} {run}')

                agents = []

                with open(os.path.join(run_dir, 'agents.json')) as f:
                    data = json.load(f)['setup']['agents']

                    for agent in data:
                        agents.append(agent)
                        print(f' - Inserted Agent: {agent}', end='\r')
                    print(f' - All Agents Inserted')

                self.mongo.insert(simulation, f'{run}_agents', agents)

                time_steps = []

                for time_step in os.listdir(run_dir):
                    if time_step == 'agents.json':
                        continue
                    if time_step == 'final.json':
                        continue

                    intersection_bike_flow = []
                    intersection_car_flow = []

                    road_bike_flow = []
                    road_car_flow = []
                    road_bike_density = []
                    road_car_density = []

                    time = int(time_step.split('.')[0])

                    with open(os.path.join(run_dir, time_step)) as f:
                        data = json.load(f)

                        for intersection in data['intersections']:
                            intersection_bike_flow.append(intersection['bikeFlow'])
                            intersection_car_flow.append(intersection['carFlow'])
                        for road in data['streets']:
                            road_bike_flow.append(road['bikeFlow'])
                            road_car_flow.append(road['carFlow'])
                            road_bike_density.append(road['bikeDensity'])
                            road_car_density.append(road['carDensity'])

                        time_steps.append({
                            'time': time,
                            'time_step': time_step,
                            'intersection_bike_flow': intersection_bike_flow,
                            'intersection_car_flow': intersection_car_flow,
                            'road_bike_flow': road_bike_flow,
                            'road_car_flow': road_car_flow,
                            'road_bike_density': road_bike_density,
                            'road_car_density': road_car_density
                        })

                        print(f' - Inserted Timestep: {time}', end='\r')

                self.mongo.insert(simulation, f'{run}_timesteps', time_steps)
                print(' - All Timesteps Inserted')
            print('')


def get_sub_folders(path):
    sub_folders = []
    for sub_folder in os.listdir(path):
        if os.path.isdir(os.path.join(path, sub_folder)):
            sub_folders.append(sub_folder)

    return sub_folders


if __name__ == '__main__':
    i = Ingest('/var/lib/mongodb/', 'LARGE_TRAFFIC_SIG')
    i.ingest_simulations()

