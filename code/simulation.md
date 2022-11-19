# How Jannick would like simulation data

## Basics

> Data format: `JSON`

> File Extension `.sim`

## Structure

```json
{
    "setup": {
        "agents": {
            <agent_1_id>: {
                "id": <agent_1_id>,
                "type": <agent_1_type>,
            },
            <agent_2_id>: {
                "id": <agent_2_id>,
                "type": <agent_2_type>,
            }
        },
        "map": <Map_Export>
    },
    "peripherals": {
        "type": "simulation",
        "date": "yyyy-mm-dd_hh-mm-ss",
    },
    "simulation": [
        {
            <agent_1_id>: {
                "road": <road_id>,
                "percent_to_end": <percent_to_end>,
                "distance_to_side": <distance_to_side>
            },
            <agent_2_id>: {
                "road": <road_id>,
                "percent_to_end": <percent_to_end>,
                "distance_to_side": <distance_to_side>
            }
        }
    ]
}
```
The structure of the json should look as above.

### Setup
The Setup section contains all the information needed to create the simulation. 
This includes the agents and the map.

#### Agents
The agents section contains all the agents that are in the simulation.
Each agent has an id and a type and should have it's id as the key.

#### Map
The map section contains the map that is used in the simulation.
This is the same map that is exported from the map editor.
This map will be provided for the simulation and just need to be loaded.

### Peripherals
The peripherals section contains information about the simulation.
This includes the type of the file and the date of the simulation.

### Simulation
The simulation section contains the actual simulation data.
This is a list of all the steps in the simulation.
Each step contains the position of all the updated agents in the simulation.
The position of an agent is defined by the road it is on, the percent to the end of the road and the distance to the side of the road.
