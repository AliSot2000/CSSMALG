#pragma once

#include <cstdint>
#include <queue>
#include <vector>
#include <string>

enum ActorTypes {
	Bike,
	Car
};

typedef struct Actor {
	ActorTypes type;

	float distanceToCrossing = 0.0f;
	int distanceToRight = 0;
	float speed = 0.0f; // m/s
	float length = 0.0f; // m
	float width = 0.0f; // m

	// Only used for visualization
	std::string id = "empty";
} actor_t;

enum StreetTypes {

	OnlyBike,
	OnlyCar,
	Both
};

typedef struct Street {
	int32_t start = -1;
	int32_t end = -1;

	struct Street* opposite = nullptr;
	StreetTypes type = StreetTypes::Both;
	float width = 0.0f;
	float length = 0.0f;

	// Ordered by distance to end, must be reordered when actors change position
	// Furthermore, when vehicles swap position, their position to the left of the road side must be swapped aswell
	std::vector<Actor*> traffic;

	// These values are not used by the simulation itself, just for the visulisation later
	// start and end position
	std::string id;
	float sx, sy;
	float ex, ey;
} street_t;

typedef struct Crossing {
	int32_t id;
	std::vector<Street*> inbound;
	std::vector<Street*> outbound;

	
} crossing_t;

typedef struct World {
	std::vector<Crossing> crossings;
	std::vector<Street> streets;
	std::vector<Actor> actors;
} world_t;
