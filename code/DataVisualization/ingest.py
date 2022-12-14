import mongo_api as mongo
from database import db_username, db_password, db_ip, db_name
import json
import os


class Ingest:

    def __init__(self, path_to_data: str):
        self.path_to_data = os.path.normcase(path_to_data)
        self.mongo = mongo.MongoAPI(db_username, db_password, db_ip, db_name)

    def get_simulations(self, name: str):
        simulations = []
        sim_dir = os.path.join(self.path_to_data, name)
        for simulation in sim_dir:
            if os.path.isdir(os.path.join(sim_dir, simulation)):
                simulations.append(simulation)

        return simulations

