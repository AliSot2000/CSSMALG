"""
Script loads the Arrived Agents from the Agents file and builds a new agents file containing only the agents that
arrived at their destination
"""
import argparse
import json
import os
from typing import Tuple
from dataclasses import dataclass


@dataclass
class Road:
    identifier: str
    agents = 0


def fill(base: str, length: int, fill_char: str = " "):
    """
    Due to a lack of research, I decided to write a quick function which emulates std::setw and std::fill

    :param base: thing you want to write
    :param length: length to fill up to
    :param fill_char: character to use to fill
    :return:
    """
    if len(base) >= length:
        return base

    return base + fill_char * (length - len(base))


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
        if a["start_time"] == -1:
            held_back += 1

    print(f"Total Actors {total}")
    print(f"Arrived {done}, which are {done / total * 100}%")
    print(f"In the Waiting queues {waiting}, which are {waiting / total * 100}%")
    print(f"Never left queue  {held_back}, which are {held_back / total * 100}%")


def build_new_imput(allowed: list, all_agents: dict) -> dict:
    """
    Build new input by selecting the agents from the input file.

    :param allowed: list of allowed agents
    :param all_agents: all agents from the previous file
    :return:
    """
    bikes = all_agents["bikes"]
    cars = all_agents["cars"]

    result = {"bikes": {}, "cars": {}}

    # go through bikes and add the bikes which are in the allowed list to the new output dict
    for key, value in bikes.items():
        if key in allowed:
            result["bikes"][key] = value

    for key, value in cars.items():
        if key in allowed:
            result["cars"][key] = value

    return result


def split_arrived_stuck(sim_out: dict) -> Tuple[list, list]:
    """
    Retrieves the ids of the arrived and the stuck agents.

    :param sim_out: output of the simulation
    :return: arrived agents ids, stuck agents ids.
    """
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
    """
    Load Json File from Disk

    :param path: path to file
    :return:
    """
    with open(path, "r") as file:
        data = json.load(file)
    return data


def write_json(path, data):
    """
    Write the Data to the json file

    :param path: path to file
    :param data: data to be written
    :return:
    """
    with open(path, "w") as file:
        json.dump(data, file)


def get_stuck_roads(sim_out: dict, number_of_roads: int = 20):
    """
    List the most stuck agents.
    :param sim_out:
    :param number_of_roads:
    :return:
    """
    agents: dict = sim_out["simulation"][0]["agents"]

    waiting_streets = {}
    traffic_streets = {}
    overall_streets = {}

    # adding the roads
    for aid, agent in agents.items():
        # we're only interested in the agents that don't arrive
        if agent["end_time"] != -1:
            continue

        if agent["distance_to_side"] == -10000.0:
            # update the waiting streets, i.e. the actors waiting to be allowed into the streets
            if waiting_streets.get(agent["road"]) is None:
                waiting_streets[agent["road"]] = Road(agent["road"])
            waiting_streets[agent["road"]].agents += 1

        else:
            # update the actors which are on streets and stuck
            if traffic_streets.get(agent["road"]) is None:
                traffic_streets[agent["road"]] = Road(agent["road"])
            traffic_streets[agent["road"]].agents += 1

        # update the actors overall which are stuck
        if overall_streets.get(agent["road"]) is None:
            overall_streets[agent["road"]] = Road(agent["road"])
        overall_streets[agent["road"]].agents += 1

    # sorting and creating the output
    waiting_streets_top = [street for street in waiting_streets.values()]
    traffic_streets_top = [street for street in traffic_streets.values()]
    overall_streets_top = [street for street in overall_streets.values()]

    waiting_streets_top.sort(key=lambda x: x.agents, reverse=True)
    traffic_streets_top.sort(key=lambda x: x.agents, reverse=True)
    overall_streets_top.sort(key=lambda x: x.agents, reverse=True)

    header = fill("Top", 3) + " | " + fill("Waiting", 7) + " | " + fill("Traffic", 7) + " | " + fill("General", 7)
    print(header)
    print(len(header) * "-")

    # printing statistics on roads with the most stuck agents
    for i in range(number_of_roads):
        waiting = ""
        traffic = ""
        overall = ""

        if i < len(waiting_streets_top):
            waiting = waiting_streets_top[i].identifier

        if i < len(traffic_streets_top):
            traffic = traffic_streets_top[i].identifier

        if i < len(overall_streets_top):
            overall = overall_streets_top[i].identifier

        line = fill(str(1+i), 3) + " | " + fill(waiting, 7) + " | " + fill(traffic, 7) + " | " + fill(overall, 7)
        print(line)


if __name__ == "__main__":
    # arg parsing to make interfacing with bash easier
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
    get_stuck_roads(data)

    if arrived is not None or stuck is not None:
        if sim_in is None:
            raise ValueError("To compute new stuff, a input file needs to be specified.")
        # split the agents
        print("Splitting Agents")
        arrived_agents, stuck_agents = split_arrived_stuck(data)
        initial_data = load_json(sim_in)

        # writing the arrived agents if a path was provided
        if arrived is not None:
            print("Generating Arrived Agents")
            only_arrived = build_new_imput(arrived_agents, initial_data)
            print("Writing Arrived Agents")
            write_json(arrived, only_arrived)

        # writing the stuck agents if a path was provided
        if stuck is not None:
            print("Generating Stuck Agents")
            only_stuck = build_new_imput(stuck_agents, initial_data)
            print("Writing Stuck Agents")
            write_json(stuck, only_stuck)

