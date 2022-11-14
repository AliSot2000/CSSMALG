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

	float distance = 0.0f;
	float speed;
	float length;
	float width;
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
