import json
import os
from typing import Tuple


def printer(path: str) -> Tuple[float, str]:
    # with open("/home/alisot2000/Downloads/test_only_sim.sim", "r") as file:
    with open(path, "r") as file:
    # with open("/media/alisot2000/DumpStuff/CSSMALG_FINAL/LARGE_TRAFFIC_SIG/14percent_bikes/full_sim_5/agents.json", "r") as file:
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
