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

	float distanceToCrossing = 50.0f;
	int distanceToRight = 0;
	float speed = 8.7f; // m/s
	float length = 4.5f; // m
	float width = 1.5f; // m

	// Only used for visualization
	std::string id = "empty";
	Path path;
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
	float width = 2.0f;
	float length = 100.0f;

	// Ordered by distance to end, must be reordered when actors change position
	// Furthermore, when vehicles swap position, their position to the left of the road side must be swapped aswell
	std::vector<Actor*> traffic;

	// These values are not used by the simulation itself, just for the visulisation later
	// start and end position
	std::string id;
} street_t;

typedef struct Crossing {
	std::string id;
	std::vector<Street*> inbound;
	std::map<std::string, Street*> outbound;
	float greenPhaseDuration = 30.0f;
	float currentPhase = 30.0f;
	int32_t green = 0;

	std::vector<Actor*> waitingToBeInserted;
} crossing_t;

typedef struct World {
	std::vector<Crossing> crossings;
	std::vector<Street> streets;
	std::vector<Actor> actors;
} world_t;
