
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

int main(int argc, char* argv[]) {
	if (argc < 6) {
		std::cerr << "Usage CSSMALG <map-in> <sim-out> <n-random-cars> <n-random-bikes> <runtime> <runtime-step-time> optional <agents> <stupid_crossing>" << std::endl;
        std::cerr << "If an agents file is provided, the n-random-cars and n-random-bikes is ignored" << std::endl;
		return -1;
	}

	const char* importFile = argv[1];
	const char* outputFile = argv[2];
	const int randomCars = std::atoi(argv[3]);
	const int randomBikes = std::atoi(argv[4]);
	const auto runtime = (float)std::atof(argv[5]); // 60.0f;
	const auto deltaTime = (float)std::atof(argv[6]); // 0.25f;
    bool stupidCrossings = false;
    char* agentsFile = nullptr;

    if (argc == 7){
        agentsFile = argv[7];
    }

    if (argc == 8){
        stupidCrossings = (*argv[8] == '1');
    }

	world_t world;
	nlohmann::json import;
	
	if (!loadFile(importFile, import)) {
		return -1;
	}

	startMeasureTime("importing map");
	importMap(world, import);
	stopMeasureTime();
	
	startMeasureTime("calculating shortest path tree with floyd warshall");
	SPT carsSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyCar});
	SPT bikeSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyBike });

    nlohmann::json spts;
    exportSPT(carsSPT, bikeSPT, spts);
    save("/home/alisot2000/Documents/01_ReposNCode/CSSMALG/code/Simulation/test/data.spt", spts);

	stopMeasureTime();

	startMeasureTime("creating random actors");

    if (agentsFile != nullptr){

        nlohmann::json agents;
        if (!loadFile(importFile, agents)) {
            return -1;
        }

        importAgents(world, agents, carsSPT, bikeSPT);
    } else {
        world.actors = std::vector<Actor>(randomCars + randomBikes);
        createRandomActors(world, carsSPT, ActorTypes::Car, 30, 120, world.actors.begin(), world.actors.begin() + randomCars, 4.5f, static_cast<int>(runtime * 0.5));
        createRandomActors(world, bikeSPT, ActorTypes::Bike, 10, 25, world.actors.begin() + randomCars, world.actors.end(), 1.5f, static_cast<int>(runtime * 0.5));
    }

	stopMeasureTime();


	nlohmann::json output = exportWorld(world, runtime, deltaTime, import["peripherals"]["map"]);

    for (crossing_t& iter : world.crossings){
        std::sort(iter.waitingToBeInserted.begin(), iter.waitingToBeInserted.end(), [](const Actor* a, const Actor* b){
            return a->insertAfter < b->insertAfter;
        });
    }

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
		updateCrossings(&world, deltaTime, stupidCrossings, runtime - maxTime);
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