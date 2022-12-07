# Parsing
## Table of Contents

1. [About The Parser](#about-the-parser)
    - [General](#general)
2. [Code Structure](#code-structure)

## About the Parser
### General

The Parser is here to generate data for the simulation. With the following API request 

            [out:json]
            [bbox:lat1, lon1, lat2, lon2];
            (
                way[highway=primary];
                way[highway=secondary];
                way[highway=trunk];
                way[highway=tertiary];
                way[highway=service];
                way[highway=residential];
            )->.a;
            (.a;>;);
            out

we gather the needed raw OSM data, that is parsed. `lat1, lon1, lat2, lon2` are the coordinates marking the bounding box of the area, of which the data wants to be retrieved from. These can be set in `main.php`. For more on this, see [Code Structure](#code-structure).


## Code Structure
