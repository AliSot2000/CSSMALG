# How Nils would like simulation data

## Basics

> Data format: `JSON`

> File Extension `.tsim`

```json
{
    "peripherals": {
        "type": "to_be_simulated",
        "date": "yyyy-mm-dd_hh-mm-ss",
        "map": <Map_Export>
    },
    "roads": [
        {
            "id": <Unique_Road_ID>,
            "lanes": [
                {
                    "type": "both", 
                    "left": false, 
                    "forward": true, 
                    "right": false
                }
            ],
            "intersections": {
                "start": {
                    "id": "Intersection From"
                },
                "end": {
                    "id": "Intersection To"
                }
            },
            "distance": 31.260921205813606,
            "speed_limit": 30
        }
    ],
    "intersections": [
        {
            "id": "3077e945c5b778",
            "roads": [
                {
                    "id": "road_1"
                },
                {
                    "id": "road_2"
                },
                {
                    "id": "road_3"
                },
                {
                    "id": "road_4"
                }
            ]
        }
    ],
    "agents": [
        {
            "id": "aff495fcfc69e8",
            "type": "bike",
            "speed": "20",
            "lane": "0",
            "percent_to_end": "0.4",
            "road": "82a236c5111168"
        },
        {
            "id": "cec5733f0c7668",
            "type": "car",
            "speed": "0",
            "lane": "1",
            "percent_to_end": "0.2",
            "road": "82a236c5111168"
        }
    ]
}
```

## Peripherals
The peripherals section contains information about the simulation.
This includes the type of the file and the date of the simulation.

(Optional) The map section contains the map that is used in the simulation.
This is the same map that is exported from the map editor and will be passed along if provided in the simulated file.