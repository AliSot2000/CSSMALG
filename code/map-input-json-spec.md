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
            "speed_limit": 30,
            "oppositeStreetId": <ID_Of_Opposite_Road>
        }
    ],
    "intersections": [
        {
            "id": "3077e945c5b778",
            "roads": [
                {
                    "id": "road_1",
                    "traffic_controller": "traffic_light"
                },
                {
                    "id": "road_2",
                    "traffic_controller": "yield_sign"
                },
                {
                    "id": "road_3",
                    "traffic_controller": "stop_sign"
                },
                {
                    "id": "road_4",
                    "traffic_controller": "outgoing"
                }
            ],
            "trafficSignal": true
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

## Example from the map export:
Note that roads would have a "oppositeStreetId" if they would have an opposite.

If the traffic controller is not given by Jan, he puts "NONE" in the traffic controller field.

```json
{
  "roads": [
    {
      "id": "Facing Reee",
      "lanes": [
        {
          "type": "both",
          "direction": 1,
          "left": false,
          "forward": true,
          "right": false
        }
      ],
      "intersections": {
        "start": {
          "id": "Yeet"
        },
        "end": {
          "id": "Reeee"
        }
      },
      "distance": 38.744084608289086,
      "speed_limit": 30
    },
    {
      "id": "!Facing Yeet",
      "lanes": [
        {
          "type": "both",
          "direction": -1,
          "left": false,
          "forward": true,
          "right": false
        }
      ],
      "intersections": {
        "end": {
          "id": "Yeet"
        },
        "start": {
          "id": "Reeee"
        }
      },
      "distance": 38.74408460828907,
      "speed_limit": 30
    }
  ],
  "intersections": [
    {
      "id": "Reeee",
      "roads": [
        {
          "id": "!Facing Yeet",
          "traffic_controller": "outgoing"
        },
        {
          "id": "Facing Reee",
          "traffic_controller": "traffic_light"
        }
      ],
      "roundabout": false,
      "trafficSignal": true
    },
    {
      "id": "Yeet",
      "roads": [
        {
          "id": "Facing Reee",
          "traffic_controller": "outgoing"
        },
        {
          "id": "!Facing Yeet",
          "traffic_controller": "traffic_light"
        }
      ],
      "roundabout": true,
      "trafficSignal": true
    }
  ],
  "agents": [],
  "peripherals": {
    "date": "2022-11-05_09-43-27",
    "type": "to_be_simulated",
    "map": {
      "roads": {
        "Facing Reee": {
          "id": "Facing Reee",
          "start": {
            "x": 450,
            "y": 430,
            "angle": 0
          },
          "end": {
            "x": 730,
            "y": 250,
            "angle": 1.5707963267948966
          },
          "lanes": [
            {
              "type": "both",
              "direction": 1,
              "left": false,
              "forward": true,
              "right": false
            }
          ],
          "intersections": {
            "start": {
              "id": "Yeet",
              "snap_point": "north"
            },
            "end": {
              "id": "Reeee",
              "snap_point": "west"
            }
          },
          "distance": 387.44084608289086,
          "speed_limit": 30
        },
        "Facing Yeet": {
          "id": "Facing Yeet",
          "start": {
            "x": 470,
            "y": 450,
            "angle": 4.71238898038469
          },
          "end": {
            "x": 750,
            "y": 270,
            "angle": 3.141592653589793
          },
          "lanes": [
            {
              "type": "both",
              "direction": -1,
              "left": false,
              "forward": true,
              "right": false
            }
          ],
          "intersections": {
            "start": {
              "id": "Yeet",
              "snap_point": "east"
            },
            "end": {
              "id": "Reeee",
              "snap_point": "south"
            }
          },
          "distance": 387.4408460828907,
          "speed_limit": 30
        }
      },
      "intersections": {
        "Reeee": {
          "id": "Reeee",
          "position": {
            "x": 750,
            "y": 250,
            "angle": 0
          },
          "roads": {
            "south": {
              "id": "Facing Yeet",
              "point_type": "end"
            },
            "west": {
              "id": "Facing Reee",
              "point_type": "end"
            }
          },
          "isRoundAbout": false,
          "traffic_controllers": {
            "north": "traffic_light",
            "east": "traffic_light",
            "south": "traffic_light",
            "west": "traffic_light"
          }
        },
        "Yeet": {
          "id": "Yeet",
          "position": {
            "x": 450,
            "y": 450,
            "angle": 0
          },
          "roads": {
            "north": {
              "id": "Facing Reee",
              "point_type": "start"
            },
            "east": {
              "id": "Facing Yeet",
              "point_type": "start"
            }
          },
          "isRoundAbout": true,
          "traffic_controllers": {
            "north": "traffic_light",
            "east": "traffic_light",
            "south": "traffic_light",
            "west": "traffic_light"
          }
        }
      },
      "agents": {},
      "peripherals": {
        "date": "2022-11-05_09-43-27",
        "type": "save"
      }
    }
  }
}
```