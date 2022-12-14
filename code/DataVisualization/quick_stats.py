import json

with open("/home/alisot2000/Desktop/agents.json", "r") as file:
    data = json.load(file)

not_arrived = 0
arrived = 0
for agent in data["simulation"][0]["agents"].values():
    if agent["end_time"] == -1:
        not_arrived += 1
    else:
        arrived += 1


print(f"Not arrived Agents: {not_arrived}")
print(f"Arrived Agents: {arrived}")
print(f"Agents in total {not_arrived + arrived}")