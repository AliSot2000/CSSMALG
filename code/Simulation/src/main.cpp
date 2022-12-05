#include <iostream>
#include <vector>
#include <cstdlib>
#include <string>
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "io.hpp"
#include "utils.hpp"

#define STATUS_UPDATAE_INTERVAL 3600

int main(int argc, char* argv[]) {
	if (argc < 6) {
		std::cerr << "Usage CSSMALG <map-in> <sim-out> <n-random-cars> <n-random-bikes> <runtime> <runtime-step-time> optional <agents> <stupid_intersection>" << std::endl;
        std::cerr << "If an agents file is provided, the n-random-cars and n-random-bikes is ignored" << std::endl;
		return -1;
	}

	const char* importFile = argv[1];
	const char* outputFile = argv[2];
	const int randomCars = std::atoi(argv[3]);
	const int randomBikes = std::atoi(argv[4]);
	const auto runtime = (float)std::atof(argv[5]); // 60.0f;
	const auto deltaTime = (float)std::atof(argv[6]); // 0.25f;
    bool stupidIntersections = false;
    char* agentsFile = nullptr;

    if (argc == 7){
        agentsFile = argv[7];
    }

    if (argc == 8){
        stupidIntersections = (*argv[8] == '1');
    }

	world_t world;
	nlohmann::json import;
	
	if (!loadFile(importFile, import)) {
		return -1;
	}

    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    if (hasPrecompute(import)){
        importMap(world, import["world"]);
    } else {
        importMap(world, import);
    }
	stopMeasureTime(start);

    spt_t carsSPT;
    spt_t bikeSPT;

    if (hasPrecompute(import)){
        start = startMeasureTime("calculating shortest path tree with floyd warshall");
        importSPT(carsSPT, bikeSPT, import, world);
        stopMeasureTime(start);
    } else {
        start = startMeasureTime("calculating shortest path tree with floyd warshall");
        carsSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyCar});
        bikeSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyBike});
        stopMeasureTime(start);
    }


	start = startMeasureTime("creating random actors");

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

	stopMeasureTime(start);

    if (hasPrecompute(import)){
	    nlohmann::json output = exportWorld(world, runtime, deltaTime, import["world"]["peripherals"]["map"]);
    } else {
        nlohmann::json output = exportWorld(world, runtime, deltaTime, import["peripherals"]["map"]);
    }

    for (intersection_t& iter : world.intersections){
        std::sort(iter.waitingToBeInserted.begin(), iter.waitingToBeInserted.end(), [](const Actor* a, const Actor* b){
            return a->insertAfter < b->insertAfter;
        });
    }

	start = startMeasureTime(
		"running simulation with\n\t" +
		std::to_string(world.intersections.size()) + " intersections\n\t" +
		std::to_string(world.streets.size()) + " streets\n\t" +
		std::to_string(world.actors.size()) + " actors\n\t" +
		std::to_string(runtime) + " seconds of runtime\n\t" +
		std::to_string(deltaTime) + " seconds precision time step"
	);

	float maxTime = runtime;
    float lastDeadLock = runtime;
    float lastStatusTime = runtime;
	while (maxTime > 0.0f) {
        updateIntersections(&world, deltaTime, stupidIntersections, runtime - maxTime);
		lastDeadLock = updateStreets(&world, deltaTime) ? maxTime : lastDeadLock;
		maxTime -= deltaTime;

        // Status message about the simulation and if there are deadlocks
        if (lastDeadLock - maxTime > 10.0f){
            if (lastDeadLock - maxTime > 20.0f){
                std::cerr << "Persistent detected at " << runtime - lastDeadLock << " seconds" << std::endl;
            }
            resolveDeadLocks(&world, maxTime);
        }

        // Status messsage to tell me how far the simulation  has come along
        if (lastStatusTime - maxTime > STATUS_UPDATAE_INTERVAL){
            lastStatusTime = maxTime;
            std::cout << "Time to simulate:  " << maxTime << " remaining seconds" << std::endl;
        }

		addFrame(world, output);
	}
    // Committing final state of simulation to output, required for the start and stop time.
    addFrame(world, output, true);
	stopMeasureTime(start);

	start = startMeasureTime("saving simulation");

	save(outputFile, output);

	stopMeasureTime(start);

	return 0;
}