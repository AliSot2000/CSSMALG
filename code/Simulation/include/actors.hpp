#pragma once

#include <cstdint>
#include <queue>
#include <vector>
#include <string>
#include <map>

typedef std::queue<std::string> Path;

enum ActorTypes {
	None,
	Bike,
	Car
};

typedef struct Actor {
	ActorTypes type = ActorTypes::None;

	float distanceToCrossing = 0.0f; // Distance from street end in meters
    int distanceToRight = 0; // Distance to right curb in meters, always a factor of LANE_WIDTH defined in update.hpp
    float length = 0.f; // Length of vehicle in meters

    // Velocity
    float current_velocity = 0.0f; // m/s
    float max_velocity = 8.7f; // m/s
    float target_velocity = 8.7f; // m/s

    // Acceleration
    float current_acceleration = 0; // m/s^2
    float acceleration = 4*0.73f; // m/s^2
    float deceleration = 2*1.67f; // m/s^2
    float acceleration_exp = 10.0f; // unitless

    float insertAfter = 0.0f; // After how many seconds the actor should try to be inserted at the crossing

	Path path;

	// Only used for visualization
	std::string id = "empty";
	bool outputFlag = false; // this flag is needed for exporter to know if non-active actors status has been outputted once
} actor_t;

enum StreetTypes {
	OnlyBike,
	OnlyCar,
	Both
};

typedef struct Street {
	std::string start = ""; // ID of start crossing
	std::string end = ""; // ID of end crossing

	StreetTypes type = StreetTypes::Both;
	size_t width = 0; // Width of street in meters, should be a factor of LANE_WIDTH defined in update.hpp
	float length = 0.0f; // Length of street in meters
    float speedlimit = 0.0f; // Speed Limit for vehicles in km/h

	// Ordered list of all actors on street. Ordered by ascending Actor::distanceToCrossing 
	std::vector<Actor*> traffic;

	// These values are not used by the simulation itself, just for the visulisation later
	std::string id;
} street_t;

typedef struct Crossing {
	std::string id; // ID of crossing, used for routing and visualization
	std::vector<Street*> inbound; // All streets which end in this crossing
	std::map<std::string, Street*> outbound; // All streets which exit this crossing, leading to next crossing defined by its string id. <ID, Street*>
	float greenPhaseDuration = 5.0f; // Defines how long a traffic light stays green in seconds
	float currentPhase = 5.0f;
	int32_t green = 0; // Index of inbound street which is currently green

	std::vector<Actor*> waitingToBeInserted; // All actors which have not been inserted into simulation yet. Either waiting for space or until its insertAfter has expired
	std::vector<std::pair<Actor*, Street*>> arrivedFrom; // Contains all actors which have arrived at its destination, including from which street they came.
} crossing_t;

// Container for all simulation data, best practice is  to never use std::vector::push_back, so that all data is aligend in memory.
typedef struct World {
	std::vector<Crossing> crossings;
	std::vector<Street> streets;
	std::vector<Actor> actors;
} world_t;
