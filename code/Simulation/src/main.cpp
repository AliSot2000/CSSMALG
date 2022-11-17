/*
	TODO missing: Path planning must be able to differentiate between the different types of edges. (Simply do multiple SPT)
	TODO missing: input and output is hard coded for only street types of car / both
	TODO feature: Overtaking if opposite street is free
	TODO inconsitest: change street width to integer

	TODO rename crossings to intersections
	TODO test if crossings switch inbound streets
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

	
	/*
		world_t world;
		nlohmann::json map;
		
		if (!loadFile("C:/Users/Nils/Documents/StreetSim/CSSMALG/code/Simulation/2022-11-04_13-40-34.json", map)) {
			return -1;
		}

		importMap(world, map);

		world.actors = std::vector<Actor>(5);
		createRandomActors(world, world.streets[0], world.actors.begin(), world.actors.end());

		nlohmann::json output = exportWorld(world, runtime, deltaTime, map);

		addFrame(world, output);

		save("C:/Users/Nils/Documents/StreetSim/CSSMALG/code/Simulation/test.sim", output);
	*/
	world_t world;

	Street ab = {
		.start = "A",
		.end = "B",
		.id = "ab",
	};

	Street bc = {
		.start = "B",
		.end = "C",
		.width = 4.0f,
		.id = "bc",
	};

	world.streets.push_back(ab);
	world.streets.push_back(bc);

	Crossing a = {
		.id = "A",
		.inbound = {},
		.outbound = {{"B", &world.streets[0]}}
	};

	Crossing b = {
		.id = "B",
		.inbound = {&world.streets[0]},
		.outbound = {{"C", &world.streets[1]}}
	};

	Crossing c = {
		.id = "C",
		.inbound = {&world.streets[1]},
		.outbound = {}
	};

	world.crossings.push_back(a);
	world.crossings.push_back(b);
	world.crossings.push_back(c);

	SPT spt = calculateShortestPathTree(&world);

	Actor test = {
		.id = "test actor",
		.path = retrievePath(spt, "A", "C")
	};

	Actor obstacle = {
		.distanceToCrossing = 95.0f,
		.speed = 0.0f,
		.id = "obstacle",
		.path = retrievePath(spt, "B", "C")
	};

	world.actors.push_back(test);
	world.actors.push_back(obstacle);

	world.crossings[0].waitingToBeInserted.push_back(&world.actors[0]);
	world.streets[1].traffic.push_back(&world.actors[1]);
	// TODO write function which inserts actors at crossings
	
	const float runtime = 46.0f;
	const float deltaTime = 0.25f;

	float maxTime = runtime; 
	while (maxTime > 0.0f) {
		updateCrossings(&world, deltaTime);
		updateStreets(&world, deltaTime);
		maxTime -= deltaTime;

		std::cout << std::setprecision(3) << "FRAME " << runtime - maxTime << "s" << std::endl;
		for (const auto& street : world.streets) {
			std::cout << "Street " << street.id << std::endl;
			for (const auto& actor : street.traffic) {
				std::cout << std::setprecision(4) << "\tS" << actor->speed << "\tL" << actor->distanceToRight / LANE_WIDTH << "\tD" << actor->distanceToCrossing << std::endl;
			}
			std::cout << std::endl;
		}

	}


	return 0;
}