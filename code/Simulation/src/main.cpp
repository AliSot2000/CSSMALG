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
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "io.hpp"

int randint(int min, int max) {
	return std::rand() % (max - min + 1) + min;
}

void choseRandomPath(world_t& world, SPT& spt, std::string& start, std::string& end) {
	if (world.crossings.size() == 0) {
		std::cerr << "There are no crossings." << std::endl;
		return;
	}
	int len = (int)world.crossings.size() - 1;
	SPT::iterator startIter = spt.begin();
	std::advance(startIter, randint(0, len));
	int noFinityLoop = 0;
	while (startIter->second.size() < 2 && noFinityLoop <= world.crossings.size()) {
		startIter = spt.begin();
		std::advance(startIter, randint(0, len));
		noFinityLoop++;
	}

	if (noFinityLoop > world.crossings.size()) {
		std::cerr << "There exists no paths. Meaning one can only go from a intersection to the intersection itself." << std::endl;
		return;
	}

	auto endIter = startIter->second.begin();
	std::advance(endIter, randint(0, (int)startIter->second.size() - 1));
	
	if (endIter->first == startIter->first) {
		endIter = startIter->second.begin();
		if (endIter->first == startIter->first) 
			endIter = std::next(endIter);
	}

	start = startIter->first;
	end = endIter->first;
}

void createRandomActors(world_t& world, SPT& spt, Street& street, const std::vector<Actor>::iterator& start, const std::vector<Actor>::iterator& end) {
	float offset = street.length / (end - start);
	int index = 1;
	for (std::vector<Actor>::iterator iter = start; iter != end; iter++) {
		Actor actor = {
				.type = ActorTypes::Car,
				.distanceToCrossing = index * offset,
				.distanceToRight = 0,
				.speed = randint(10, 50) * 0.277778f, // 30km/h to 80km/h
				.length = 4.5f,
				.width = 1.5f,
				.id = std::to_string(std::rand())
		};

		
		std::string start;
		std::string end;
		choseRandomPath(world, spt, start, end);
		actor.path = retrievePath(spt, start, end);

		for (auto& crossing : world.crossings) {
			if (crossing.id == start) {
				crossing.waitingToBeInserted.push_back(&(*iter));
				break;
			}
		}
		*iter = actor;
		// street.traffic.push_back(&(*iter));
		index++;
	}
}

std::chrono::steady_clock::time_point start;

void startMeasureTime(std::string task) {
	std::cout << "Starting task: " << task << std::endl;
	start = std::chrono::high_resolution_clock::now();
}

void stopMeasureTime() {
	std::cout << "Last task took " << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::high_resolution_clock::now() - start).count() / 1000.f << " seconds.\n\n" << std::endl;
}

int main(int argc, char* argv[]) {

	if (argc < 6) {
		std::cerr << "Usage CSSMALG <map-in> <sim-out> <n-random-actors> <runtime> <runtime-step-time>" << std::endl;
		return -1;
	}

	const char* importFile = argv[1];
	const char* outputFile = argv[2];
	const int randomActors = std::atoi(argv[3]);
	const float runtime = (float)std::atof(argv[4]); // 60.0f;
	const float deltaTime = (float)std::atof(argv[5]); // 0.25f;

	world_t world;
	nlohmann::json import;
	
	if (!loadFile(importFile, import)) {
		return -1;
	}

	startMeasureTime("importing map");
	importMap(world, import);
	stopMeasureTime();
	
	startMeasureTime("calculating shortest path tree with floyd warshall");
	SPT spt = calculateShortestPathTree(&world);
	stopMeasureTime();


	startMeasureTime("creating random actors");

	if (randomActors > 0) {
		world.actors = std::vector<Actor>(randomActors);
		createRandomActors(world, spt, world.streets[0], world.actors.begin(), world.actors.end());
	}
	stopMeasureTime();


	nlohmann::json output = exportWorld(world, runtime, deltaTime, import["peripherals"]["map"]);

	startMeasureTime(
		"running simulation with\n\t" +
		std::to_string(world.crossings.size()) + " intersections\n\t" +
		std::to_string(world.streets.size()) + " streets\n\t" +
		std::to_string(world.actors.size()) + " actors\n\t" +
		std::to_string(runtime) + " seconds of runtime\n\t" +
		std::to_string(deltaTime) + " seconds precision time step"
	);

	float maxTime = runtime; 
	while (maxTime > 0.0f) {
		updateCrossings(&world, deltaTime);
		updateStreets(&world, deltaTime);
		maxTime -= deltaTime;

		addFrame(world, output);
	}
	stopMeasureTime();

	startMeasureTime("saving simulation");

	save(outputFile, output);

	stopMeasureTime();

	return 0;
}