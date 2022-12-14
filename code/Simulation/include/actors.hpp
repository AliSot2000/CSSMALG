/*
This file contains definitions for the various types used in the simulation.

Types:

actor_t: Represents an actor(vehicle) in the simulation.
StreetTypes : Enum representing the type of street(OnlyBike, OnlyCar, Both).
street_t : Represents a street in the simulation.
intersection_t : Represents an intersection in the simulation.
World : Represents the entire simulation world.
*/

#pragma once

#include <cstdint>
#include <queue>
#include <vector>
#include <string>
#include <map>

typedef std::queue<int> Path;

enum ActorTypes {
    Bike,
    Car
};

typedef struct Actor {
    ActorTypes type = ActorTypes::Car;

    // Position of the actor.
    float distanceToIntersection = 50.0f;
    int distanceToRight = 0;
    float length = 4.5f; //

    // Velocity
    float current_velocity = 0.0f; // m/s
    float max_velocity = 8.7f; // m/s
    float target_velocity = 8.7f; // m/s

    // Acceleration
    float current_acceleration = 0; // m/s^2
    float acceleration = 4*0.73f; // m/s^2
    float deceleration = 2*1.67f; // m/s^2
    float acceleration_exp = 10.0f; // unitless

    float insertAfter = 0.0f; // After how many seconds the actor should try to be inserted at the intersection

    // Only used for visualization
    std::string id = "empty";
    Path path;
    bool outputFlag = false; // this flag is needed for exporter to know if non-active actors status has been outputted once

    float start_time = -1.0f;
    float end_time = -1.0f;
    float time_spent_waiting = 0.0f;

    int start_id = -1;
    int end_id = -1;

    bool Teleport = false;
    bool arrived = false;
    int tempDistanceToRight = 0;
    float overtaking_distance = 0;
    float distanceToFront = 0;
} actor_t;

enum StreetTypes {
    OnlyBike,
    OnlyCar,
    Both
};

typedef struct Street {
    int start = -1;
    int end = -1;

    struct Street* opposite = nullptr;
    std::string opposite_id = "empty";
    StreetTypes type = StreetTypes::Both;
    size_t width = 2;
    float length = 100.0f;
    float speedlimit = 50.0f; // km/h

    // Ordered by distance to end, must be reordered when actors change position
    // Furthermore, when vehicles swap position, their position to the left of the road side must be swapped as well
    std::vector<Actor*> traffic;

    // These values are not used by the simulation itself, just for the visualization later
    // start and end position
    std::string id;
    float density_accumulate_bike = 0.0f;
    uint64_t total_traffic_count_bike = 0;
    float flow_accumulate_bike = 0.0f;
    float density_accumulate_car = 0.0f;
    uint64_t total_traffic_count_car = 0;
    float flow_accumulate_car = 0.0f;
    bool allowOvertake = false;
} street_t;

typedef struct Intersection {
    int id;
    std::vector<Street*> inbound;
    std::map<int, Street*> outboundCar;
    std::map<int, Street*> outboundBike;
    float greenPhaseDuration = 5.0f;
    float currentPhase = 5.0f;
    int32_t green = 0;

    std::vector<Actor*> waitingToBeInserted;
    std::vector<std::pair<Actor*, Street*>> arrivedFrom;
    bool outputFlag = true; // All intersections which have this set are added to the output.
    bool hasTrafficLight = false;
    float car_flow_accumulate = 0.0f;
    float bike_flow_accumulate = 0.0f;
    bool needsUpdate = false;
} intersection_t;

typedef struct World {
    std::vector<Intersection> intersections;
    std::vector<Street> streets;
    std::vector<Actor*> actors;
    std::map<std::string, int> string_to_int;
    std::map<int, std::string> int_to_string;
    std::vector<Intersection*> IntersectionPtr;
    std::vector<Street*> StreetPtr;
    Street empty;
} world_t;
