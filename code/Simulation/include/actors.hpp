#pragma once

#include <cstdint>
#include <queue>
#include <vector>
#include <string>
#include <map>

typedef std::queue<std::string> Path;

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
} actor_t;

enum StreetTypes {
	OnlyBike,
	OnlyCar,
	Both
};

typedef struct Street {
	std::string start = "";
	std::string end = "";

	struct Street* opposite = nullptr;
	StreetTypes type = StreetTypes::Both;
	size_t width = 2;
	float length = 100.0f;
    float speedlimit = 50.0f; // km/h

	// Ordered by distance to end, must be reordered when actors change position
	// Furthermore, when vehicles swap position, their position to the left of the road side must be swapped aswell
	std::vector<Actor*> traffic;

	// These values are not used by the simulation itself, just for the visulisation later
	// start and end position
	std::string id;
} street_t;

typedef struct Intersection {
	std::string id;
	std::vector<Street*> inbound;
	std::map<std::string, Street*> outbound;
	float greenPhaseDuration = 5.0f;
	float currentPhase = 5.0f;
	int32_t green = 0;

	std::vector<Actor*> waitingToBeInserted;
	std::vector<std::pair<Actor*, Street*>> arrivedFrom;
    bool outputFlag = true; // All intersections which have this set are added to the output.
    bool hasTrafficLight = false;
} intersection_t;

typedef struct World {
	std::vector<Intersection> intersections;
	std::vector<Street> streets;
	std::vector<Actor> actors;
} world_t;
