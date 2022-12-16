# TODOS, Alex puts them here.
- TODO feature: Overtaking if opposite street is free
- TODO feature: writing to disk at certain size
- TODO feature: non-traffic-light-crossing
- OLA 
    

### CONSTRAINTS:
Generation on my side will need to do this when importing the map.
If a street has the following lanes:
1. Bike
2. Car
3. Car  

They should be added as two separate streets, one with type OnlyCar and one with OnlyBike.
This will make sure SPT calculates proper paths

If between nodes there exists two streets like
1. OnlyCar
2. Both

-> this could lead to unknown behaviour while doing the route planning. 
   There should always only be one street between two intersections for each actor type



