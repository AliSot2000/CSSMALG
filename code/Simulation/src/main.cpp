/*
	TODO bug: There is a bug where a car which is at a crossing waiting and wedged in every where wants to drive backwards?
	TODO missing: Path planning must be able to differentiate between the different types of edges. (Simply do multiple SPT)
	TODO missing: input and output is hard coded for only street types of car / both
	TODO feature: Overtaking if opposite street is free
	TODO inconsitest: change street width to integer
*/

#include <iostream>
#include <iomanip>
#include <vector>
#include <cstdlib>
#include <string>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "io.hpp"

int randint(int min, int max) {
	return std::rand() % (max - min + 1) + min;
}

void createRandomActors(world_t& world, Street& street, const std::vector<Actor>::iterator& start, const std::vector<Actor>::iterator& end) {
	float offset = street.length / (end - start);
	int index = 1;
	for (std::vector<Actor>::iterator iter = start; iter != end; iter++) {
		Actor actor = {
				.type = ActorTypes::Car,
				.distanceToCrossing = index * offset,
				.distanceToRight = 0,
				.speed = randint(80, 220) / 10.0f, // 30km/h to 80km/h
				.length = 4.5f,
				.width = 1.5f,
				.id = std::to_string(std::rand())
		};
		*iter = actor;
		street.traffic.push_back(&(*iter));
		index++;
	}
}

int main(int argc, char* argv[]) {

	world_t world;
	nlohmann::json map;
	
	if (!loadFile("C:/Users/Nils/Documents/StreetSim/CSSMALG/code/Simulation/2022-11-04_13-40-34.json", map)) {
		return -1;
	}

	importMap(world, map);

	world.actors = std::vector<Actor>(5);
	createRandomActors(world, world.streets[0], world.actors.begin(), world.actors.end());

	const float runtime = 46.0f;
	const float deltaTime = 0.25f;

	nlohmann::json output = exportWorld(world, runtime, deltaTime, map);

	
	float maxTime = runtime; 
	while (maxTime > 0.0f) {
		updateStreets(&world, deltaTime);
		addFrame(world, output);
		maxTime -= deltaTime;


		std::cout << std::setprecision(3) << "FRAME " << runtime - maxTime << "s" << std::endl;
		for (const auto& actor : world.streets[0].traffic) {
			std::cout << std::setprecision(4) << "\tS" << actor->speed << "\tL" << actor->distanceToRight / LANE_WIDTH << "\tD" << actor->distanceToCrossing << std::endl;
		}
		std::cout << std::endl;
	}

	save("C:/Users/Nils/Documents/StreetSim/CSSMALG/code/Simulation/test.sim", output);

	return 0;
}