/*
	TODO missing: Path planning must be able to differentiate between the different types of edges. (Simply do multiple SPT)
	TODO feature: Overtaking if opposite street is free
	TODO inconsitest: change street width to integer
*/

#include <iostream>
#include <iomanip>
#include <vector>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "export.hpp"


int main(int argc, char* argv[]) {

	world_t world;

	world.actors = std::vector<Actor>();
	world.actors.push_back(
		{
			.type = ActorTypes::Car,
			.distanceToCrossing = 50.0f,
			.distanceToRight = 2,
			.speed = 0.f,
			.length = 4.5f,
			.width = 1.5f,
			.id = "AAAAAAAAAAAAA"
		}
	);

	world.actors.push_back(
		{
			.type = ActorTypes::Car,
			.distanceToCrossing = 70.0f,
			.distanceToRight = 0,
			.speed = 3.78f,
			.length = 4.5f,
			.width = 1.5f,
			.id = "BBBBBBBBBBBBB"
		}
	);

	world.actors.push_back(
		{
			.type = ActorTypes::Car,
			.distanceToCrossing = 85.0f,
			.distanceToRight = 0,
			.speed = 4.78f,
			.length = 4.5f,
			.width = 1.5f,
			.id = "CCCCCCCCCCCCC"
		}
	);

	world.streets = std::vector<Street>(1);
	Street& street = world.streets[0];
	street.id = "5d5936e6768d2";
	street.sx = 300;
	street.sy = 500;
	street.ex = 850;
	street.ey = 200;

	street.length = 100.0f;
	street.width = 4.0f;
	street.type = StreetTypes::Both;

	street.traffic.push_back(&world.actors[0]);
	street.traffic.push_back(&world.actors[1]);
	street.traffic.push_back(&world.actors[2]);

	nlohmann::json output = exportWorld(world);

	const float runtime = 46.0f;
	float maxTime = runtime; 
	const float deltaTime = 0.25f;

	std::vector<int32_t> lastLanes = {-1, -1, -1};
	while (maxTime > 0.0f) {
		maxTime -= deltaTime;
		updateStreets(&world, deltaTime);

		std::vector<int32_t> currentLanes;

		for (const auto& actor : street.traffic) {
			currentLanes.push_back(actor->distanceToRight);
		}

		if (lastLanes != currentLanes) {
			std::cout << std::setprecision(3) << "FRAME " << runtime - maxTime << "s" << std::endl;
			for (const auto& actor : street.traffic) {
				std::cout << std::setprecision(4) << "\tS" << actor->speed << "\tL" << actor->distanceToRight / LANE_WIDTH << "\tD" << actor->distanceToCrossing << std::endl;
			}
			std::cout << std::endl;
			lastLanes = currentLanes;
		}

		addFrame(world, output);
	}

	save("C:/Users/Nils/Documents/StreetSim/CSSMALG/code/Simulation/test.sim", output);

	return 0;
}