import os
import json

with open("/home/alisot2000/Desktop/agents.json", "r") as file:
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

print(f"Not arrived Agents: {not_arrived}")
print(f"Arrived Agents: {arrived}")
print(f"Agents in total {not_arrived + arrived}")
print(f"Time Spent waiting in avg: {time_spent_waiting / (not_arrived + arrived)}")
print(f"Percent Arrived {arrived / (not_arrived + arrived) * 100}%")
