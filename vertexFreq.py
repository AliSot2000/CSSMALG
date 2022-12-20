import os
import json
from dataclasses import dataclass
import matplotlib.pyplot as plt


@dataclass
class Vertex:
    num: str
    via: int = 0
    start: int = 0
    end: int = 0


freq = {}

with open("/home/alisot2000/Desktop/pathFreq.json", "r") as f:
    data = json.load(f)

    agents: dict = data["setup"]["agents"]

    for key, agent in agents.items():
        if freq.get(agent["path"][0]) is None:
            freq[agent["path"][0]] = Vertex(agent["path"][0])
        freq[agent["path"][0]].start += 1
        if freq.get(agent["path"][-1]) is None:
            freq[agent["path"][-1]] = Vertex(agent["path"][0])
        freq[agent["path"][-1]].end += 1

        for i in range(1, len(agent["path"])-1):
            if freq.get(agent["path"][i]) is None:
                freq[agent["path"][i]] = Vertex(agent["path"][i])
            freq[agent["path"][i]].via += 1

freq_list = [value for key, value in freq.items()]

freq_list.sort(key=lambda x: x.via, reverse=True)
for i in range(100):
    print(f"placed {i+1:03} vertex {freq_list[i].num} with {freq_list[i].via} via")


plt.figure(figsize=(20, 10))
plt.plot([i for i in range(len(freq_list))], [i.via for i in freq_list])
plt.show()
plt.savefig("/home/alisot2000/Desktop/vertex_freq.png")
