# How Alex would like to have the agents from Jan

agent is an object containing
- length, float 
- max_velocity, float in km/h
- acceleration, float, the 'acceleration' in m/s^2, denoted _a_ in the formula
- deceleration, float, the 'deceleration' in m/s^2 denoted _b_ in the formula
- acceleration_exponent, float, the exponent of the positive acceleration, denoted _sigma_ in the formula
- waiting_period, float, the number of seconds to wait before the actor starts its journey.
- key, string, the id of the actor. Must be unique
- start_id, string, the id_string of the start crossing
- end_id, string the id_string of the end intersection

The actors are stored in two objects, 'bikes' and 'cars' denoting their type.

The final JSON should look something like this:

```json
{
  "bikes": {
    "id1" : {
      "length": 1.5,
      "max_velocity": 25.0, 
      "acceleration": 2.0,
      "deceleration": 4.0,
      "acceleration_exponent": 10.0,
      "waiting_period": 10.0,
      "start_id": "Intersection1",
      "end_id": "Intersection2"
    },
    "id2" : {
      "length": 1.5,
      "max_velocity": 30.0,
      "acceleration": 3.0,
      "deceleration": 4.0,
      "acceleration_exponent": 10.0,
      "waiting_period": 10.0,
      "start_id": "Intersection5",
      "end_id": "Intersection9"
    },
    ...
  },
  "cars": {
    "id1" : {
      "length": 1.5,
      "max_velocity": 80.0,
      "acceleration": 2.0,
      "deceleration": 4.0,
      "acceleration_exponent": 10.0,
      "waiting_period": 10.0,
      "start_id": "Intersection1",
      "end_id": "Intersection2"
    },
    "id2" : {
      "length": 1.5,
      "max_velocity": 120.0,
      "acceleration": 5.0,
      "deceleration": 8.0,
      "acceleration_exponent": 10.0,
      "waiting_period": 10.0,
      "start_id": "Intersection5",
      "end_id": "Intersection9"
    },
    ...
  }
}
```

Currently, these are the values used to test the simulation, but please give me sets of data with other values to test.
```c++
float length = 4.5f; // For cars
float length = 1.5f; // For bikes

// Velocity
float current_velocity = 0.0f; // m/s
float max_velocity = 8.7f; // m/s
float target_velocity = 8.7f; // m/s

// Acceleration
float current_acceleration = 0; // m/s^2
float acceleration = 4*0.73f; // m/s^2
float deceleration = 2*1.67f; // m/s^2
float acceleration_exp = 10.0f; // unitless
```