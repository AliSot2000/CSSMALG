import json
import os
from dataclasses import dataclass


@dataclass
class Agent:
    is_car: bool = True
    length: float = 0
    start_id: str = ""
    end_id: str = ""
    id: str = ""
    distance: float = 0
    start_time: float = 0
    end_time: float = 0
    time_spent_waiting: float = 0
    travel_time: float = 0


def load_json(path):
    with open(path, "r") as file:
        data = json.load(file)

    return data


class AgentVelocityPlotter:
    data_root: str
    agent_files: list = []
    percent_group: dict = {}
    # percente groups is like
    # 0percentBikes
    # 2percentBikes
    # ...

    # in each percent group is a list. The list contains the data of each simulation
    # the list contains Agent objects, the agent objects contain the relevant data for visualization
    # TODO watchout for agents with -1 as their

    def __init__(self, root_path):
        if not os.path.exists(root_path) or not os.path.isdir(root_path):
            raise ValueError("Provided Data Root is not valid")

    def find_agents(self):
        # go through CSSMALG_DATA
        agent_files = []
        for file in os.listdir(self.data_root):
            if os.path.isdir(os.path.join(self.data_root, file)):
                # generate empty thing
                self.percent_group[file] = [{} for i in range(10)]

                # go through 0percent_bike
                for file2 in os.listdir(os.path.join(self.data_root, file)):
                    if os.path.isdir(os.path.join(self.data_root, file, file2)):

                        file_path = os.path.join(self.data_root, file, file2, "agents.json")

                        # check for existence of agent file
                        if os.path.exists(file_path) and os.path.isfile(file_path):
                            agent_files.append(file_path)

        self.agent_files = agent_files

    def load_agent_data(self):
        # get the dict value
        for agent_file in self.agent_files:
            data = load_json(agent_file)

            agent_start = data["setup"]["agents"]

            target_index = int(os.path.basename(os.path.dirname(agent_file)).split("_")[2])
            target_percentile = os.path.basename(os.path.dirname(os.path.dirname(agent_file)))

            agent_start: dict
            for agent_id, agent in agent_start.items():
                agent_obj = Agent(is_car=(agent["type"] == "car"),
                                  length=agent["length"],
                                  start_id=agent["start_crossing_id"],
                                  end_id=agent["end_crossing_id"],
                                  id=agent["id"],
                                  distance=agent["travel_distance"])

                self.percent_group[target_percentile][target_index][agent_id] = agent_obj

            agent_end = data["simulation"][0]["agents"]
            for agent_id, agent in agent_end.items():
                agent_obj = self.percent_group[target_percentile][target_index][agent_id]
                agent_obj: Agent
                agent_obj.start_time = agent["start_time"]
                agent_obj.end_time = agent["end_time"]
                agent_obj.time_spent_waiting = agent["time_spent_waiting"]

    def compute_plot_data(self):
        # TODO GENERATE DATA FROM THAT STUFF
        pass