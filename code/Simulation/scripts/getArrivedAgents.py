"""
Script loads the Arrived Agents from the Agents file and builds a new agents file containing only the agents that
arrived at their destination
"""
import argparse
import json
import os
from typing import Tuple


def print_stats(sim_out: dict):
    """
    Print Agent Statistics
    :param sim_out: json output of the agents of a simulation
    :return:
    """
    agents = sim_out["simulation"][0]["agents"]

    done = 0
    total = len(agents)
    waiting = 0
    held_back = 0

    for k, a in agents.items():
        if a["end_time"] != -1:
            done += 1
        if a["end_time"] == -1 and a["distance_to_side"] == -10000.0:
            waiting += 1
        if a["start_time"] != -1:
            held_back += 1

    print(f"Total Actors {total}")
    print(f"Arrived {done}, which are {done / total * 100}%")
    print(f"In the Waiting queues {waiting}, which are {waiting / total * 100}%")
    print(f"Never left queue  {held_back}, which are {held_back / total * 100}%")


def build_new_imput(allowed: list, all_agents: dict) -> dict:
    bikes = all_agents["bikes"]
    cars = all_agents["cars"]

    result = {"bikes": {}, "cars": {}}

    # go through bikes and add the bikes which are in the allowed list to the new output dict
    for key, value in bikes:
        if key in allowed:
            result["bikes"][key] = value

    for key, value in cars:
        if key in allowed:
            result["cars"][key] = value

    return result


def split_arrived_stuck(sim_out: dict) -> Tuple[list, list]:
    arrived_ids = []
    stuck_ids = []

    agents = sim_out["simulation"][0]["agents"]

    for k, a in agents.items():
        if a["end_time"] != -1:
            arrived_ids.append(k)
        else:
            stuck_ids.append(k)

    return arrived_ids, stuck_ids


def load_json(path):
    with open(path, "r") as file:
        data = json.load(file)
    return data


def write_json(path, data):
    with open(path, "w") as file:
        json.dump(data, path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Give a resulting agents.json file and a agents input json file to "
                                                 "create a new agents file containing only the ones that arrived and"
                                                 "or only the ones that didn't arrive.")

    parser.add_argument("-o", "--output", type=str, help="The output from a simulation", required=True)
    parser.add_argument("-i", "--input", type=str, help="The original input of the simulation", default=None)
    parser.add_argument("-a", "--arrived", type=str, help="Output file containing only the arrived agents", default=None)
    parser.add_argument("-s", "--stuck", type=str, help="Output file containing only the not arrived agents", default=None)

    arguments = parser.parse_args()

    sim_out = arguments.output
    sim_in = arguments.input

    arrived = arguments.arrived
    stuck = arguments.stuck

    # information
    data = load_json(sim_out)
    print_stats(data)

    if arrived is not None or stuck is not None:
        if sim_in is None:
            raise ValueError("To compute new stuff, a input file needs to be specified.")
        # split the agents
        print("Splitting Agents")
        arrived_agents, stuck_agents = split_arrived_stuck(data)
        initial_data = load_json(sim_in)

        if arrived is not None:
            print("Generating Arrived Agents")
            only_arrived = build_new_imput(arrived_agents, initial_data)
            print("Writing Arrived Agents")
            write_json(arrived, only_arrived)

        if stuck is not None:
            print("Generating Stuck Agents")
            only_stuck = build_new_imput(stuck_agents, initial_data)
            print("Writing Stuck Agents")
            write_json(stuck, only_stuck)

