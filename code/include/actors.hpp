#pragma once

#include <cstdint>
#include <queue>
#include <vector>

enum ActorTypes {
	Bike,
	Car
};

typedef struct Actor {
	ActorTypes type;

	bool waitingAtCrossing;
	float distanceToCrossing = 0.0f;
	float distanceToRight = 0.0f;
	float speed; // m/s
	float length; // m
	float width; // m
} actor_t;

enum StreetTypes {
	OnlyBike,
	OnlyCar,
	Both
};

typedef struct Street {
	int32_t start;
	int32_t end;

	struct Street* opposite = nullptr;
	StreetTypes type;
	float width;
	float length;

	// Ordered by distance to end, must be reordered when actors change position
	// Furthermore, when vehicles swap position, their position to the left of the road side must be swapped aswell
	std::vector<Actor*> traffic;
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
