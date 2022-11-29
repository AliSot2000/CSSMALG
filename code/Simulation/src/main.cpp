#include <iostream>
#include <vector>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "io.hpp"
#include "helpers.hpp"

int main(int argc, char* argv[]) {

	// Check correct command line arguments
	if (argc < 7) {
		std::cerr << "Usage CSSMALG <map-in> <sim-out> <n-random-cars> <n-random-bikes> <runtime> <runtime-step-time> optional <agents> <stupid_crossing>" << std::endl;
        std::cerr << "To only simulate the agents given via the <agents> file, set the n-random-cars and n-random-bikes to 0" << std::endl;
		return -1;
	}

	// Arguments
	const char* importFile = argv[1];
	const char* outputFile = argv[2];
	const int randomCars = std::atoi(argv[3]);
	const int randomBikes = std::atoi(argv[4]);
	const auto runtime = (float)std::atof(argv[5]); // Runtime in seconds
	const auto deltaTime = (float)std::atof(argv[6]); // Frame step in seconds
    char* agentsFile = argc < 8 ? nullptr : argv[7];

    bool stupidCrossings = argc < 9 ? false : *argv[8] == '1';

	world_t world;
	nlohmann::json import;
	
	if (!loadFile(importFile, import))
		return -1;

	startMeasureTime("importing map");
	importMap(world, import);
	stopMeasureTime();
	
	startMeasureTime("calculating shortest path tree with floyd warshall");
	SPT carsSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyCar});
	SPT bikeSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyBike });
	stopMeasureTime();

	startMeasureTime("creating random actors");
	world.actors = std::vector<Actor>(randomCars + randomBikes);
    createRandomActors(world, carsSPT, ActorTypes::Car, 30, 120, world.actors.begin(), world.actors.begin() + randomCars, 4.5f);
    createRandomActors(world, bikeSPT, ActorTypes::Bike, 10, 25, world.actors.begin() + randomCars, world.actors.end(), 1.5f);
	stopMeasureTime();

	startMeasureTime("importing agents file");
    if (agentsFile != nullptr){

        nlohmann::json agents;
        if (!loadFile(importFile, agents)) {
            return -1;
        }

        importAgents(world, agents, carsSPT, bikeSPT);
    }
	stopMeasureTime();

	startMeasureTime("creating export header");
	nlohmann::json output = exportWorld(world, runtime, deltaTime, import["peripherals"]["map"]);
	stopMeasureTime();

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
		updateCrossings(&world, deltaTime, stupidCrossings);
		updateStreets(&world, deltaTime);
		maxTime -= deltaTime;

		addFrame(world, output);
	}
	stopMeasureTime();

	startMeasureTime("saving simulation");
	save(outputFile, output);
	stopMeasureTime();

	return 0;
// U
}