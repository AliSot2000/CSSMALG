import json
import os
from typing import Tuple


"""
This code was used when only 2% of agents reached their destination to get a better overview of how bad
the problem was. It was useful but is no longer needed. It's here for the sake of completeness and in case of future 
need.
"""


def printer(path: str) -> Tuple[float, str]:
    """
    Reads an Agents.json file and retrieves the required statistics. Prints the statistics to console.

    :param path: path to agents file
    :return: percentage of arrived agents, path to agents file
    """
    with open(path, "r") as file:
        data = json.load(file)

    not_arrived = 0
    arrived = 0
    time_spent_waiting = 0
    for agent in data["simulation"][0]["agents"].values():
        if agent["end_time"] == -1:
            not_arrived += 1
        else:
            arrived += 1

        time_spent_waiting += agent["time_spent_waiting"]

    print(f"Path: {path}")
    print(f"Not arrived Agents: {not_arrived}")
    print(f"Arrived Agents: {arrived}")
    print(f"Agents in total {not_arrived + arrived}")
    print(f"Time Spent waiting in avg: {time_spent_waiting / (not_arrived + arrived)}")
    print(f"Percent Arrived {arrived / (not_arrived + arrived) * 100}%")
    return arrived / (not_arrived + arrived) * 100, path


def reclist(path: str) -> list:
    """
    Recursively lists all files in a directory.
    :param path: path of root dir to start listing from
    :return: list of all files in the directory
    """

    result = []
    for item in os.listdir(path):
        if os.path.isdir(os.path.join(path, item)):
            result.extend(reclist(os.path.join(path, item)))
        elif os.path.isfile(os.path.join(path, item)):
            result.append(os.path.join(path, item))
    return result


if __name__ == "__main__":
    result = reclist("/media/alisot2000/DumpStuff/CSSMALG_FINAL/")

    current_best = 0
    current_best_path = ""

    for r in result:
        if "agents.json" in r:
            best, path = printer(r)
            if best > current_best:
                current_best = best
                current_best_path = path

    print(f"Best: {current_best} at {current_best_path}")