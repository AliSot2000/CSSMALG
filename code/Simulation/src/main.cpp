/*
	TODO Overtaking if opposite street is free
*/

#include <iostream>
#include <iomanip>
#include <vector>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"

int main(int argc, char* argv[]) {

	world_t world;

	Actor actor1 = {
		.type = ActorTypes::Car,
		.distanceToCrossing = 50.0f,
		.distanceToRight = 0,
		.speed = 1.00f,
		.length = 4.5f,
		.width = 1.5f,
	};

	Actor actor2 = {
		.type = ActorTypes::Car,
		.distanceToCrossing = 70.0f,
		.distanceToRight = 0,
		.speed = 2.78f,
		.length = 4.5f,
		.width = 1.5f,
	};

	Actor actor3 = {
		.type = ActorTypes::Car,
		.distanceToCrossing = 90.0f,
		.distanceToRight = 0,
		.speed = 4.0f,
		.length = 4.5f,
		.width = 1.5f,
	};

	world.streets = std::vector<Street>(1);
	Street& street = world.streets[0];
	street.length = 100.0f;
	street.width = 4.0f;
	street.type = StreetTypes::Both;

	street.traffic.push_back(&actor1);
	street.traffic.push_back(&actor2);
	street.traffic.push_back(&actor3);

	float maxTime = 46.0f; // 10 seconds
	const float deltaTime = 0.0334f; // "30fps" 

	while (maxTime > 0.0f) {
		maxTime -= deltaTime;
		updateStreets(&world, deltaTime);

		std::cout << "--- FRAME ---" << std::endl;
		for (const auto& actor : street.traffic) {
			std::cout << std::setprecision(4) << &actor << " L" << actor->distanceToRight / LANE_WIDTH << "   D" << actor->distanceToCrossing << std::endl;
		}
	}

	return 0;
}