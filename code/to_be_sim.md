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

}
```

## Peripherals
The peripherals section contains information about the simulation.
This includes the type of the file and the date of the simulation.

(Optional) The map section contains the map that is used in the simulation.
This is the same map that is exported from the map editor and will be passed along if provided in the simulated file.