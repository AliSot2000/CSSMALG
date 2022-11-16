# How Jannick would like simulation data

## Basics

> Data format: `JSON`

> File Extension `.sim`

## Structure

```json
{
    "setup": {
        "agents": {
            "<agent_1_id>": {
                "id": <agent_1_id>,
                "type": <agent_1_type>,
            },
            "<agent_2_id>": {
                "id": <agent_2_id>,
                "type": <agent_2_type>,
            }
        },
        "map": <Map_Export> // Remove All Agents
    }