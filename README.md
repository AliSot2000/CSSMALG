# Agent-Based Modeling and Social System Simulation 2022
> * Group Name: BBAG (Big Brain Algorithm Group)
> * Group participants names: Nils Egger, Sophia Herrmann, Jan Hochstrasser, Jannick Schröer, Alexander Sotoudeh
> * Project Title: The Influence of Cyclists on Traffic

## General Introduction

Traffic Jams and road congestions are one of the most prominent problems in travel. Congestions lead to higher levels of harmful emissions, 
adverse health effects and higher cost burdens. In an effort to reduce the enviromental effect of cars, the city of Zurich is actively campaigning 
for more bicycles. This is further pushed by the post-Covid popularity. This raises the question whether more bicycles will disrupt the flow of traffic or whether the higher percentage of bicycles will relieve the burden of cars on the roads.

## The Model

The full model description can be found in the report (`doc` directory). In short, we model traffic in the city of Zurich with the following main assumptions:
- The map of Zurich bounded by the coordinates $[47.36, 8.50, 47.42, 8.56]$ ([south, west, north, east]). 
- One agent spawns per hour for every 4'000$m^2$ of the map
- The agents are spawned uniformly over time
- The agent always chose the shortest path for their route
- The start and end point of an agent's route is randomly chosen
- Intersections are all controlled by time based traffic lights
- There are no pedestrians or public transport


## Fundamental Questions

- How will the change in percentage of bicycles to cars influence the travel time of the remaining cars?
- How will the change in percentage of bicycles to cars influence the travel time of the remaining bicycles?
- How will traffic density be affected?


## Expected Results

We assume that the travel time for cars will get longer, and will get shorter for bikes. We assume that the traffic density will rise, as bicycles take less space, so therefore more can use the same space.


## Research Methods

Agent Based Modelling

## Other

We are using data from OpenStreetMap. Furthermore we optimized the code to be run on HPC Clusters.
