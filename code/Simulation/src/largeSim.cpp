//
// Created by alisot2000 on 07.12.22.
//
#include <iostream>
#include <vector>
#include <cstdlib>
#include <string>
#include <chrono>
#include <iomanip>

#include "actors.hpp"
#include "routing.hpp"
#include "update.hpp"
#include "io.hpp"
#include "utils.hpp"

#define STATUS_UPDATAE_INTERVAL 60
#define USE_STUPID_INTERSECTIONS false
//#define ADD_INCREMENTS
//#define DDEBUG

int main(int argc, char* argv[]) {
    std::cout << "MAKE SURE THAT THE MAP MATCHES THE SPT" << std::endl;

    if (argc < 9) {
        std::cerr << "Intended for large scale simulations, no visualization is produced!" << std::endl;
        std::cerr << "Usage CSSMALG <mapIn> <carTreeIn> <bikeTreeIn> <agentsIn> <stats-log-interval> <agentsOut> <statsDirOut> <runtime> <timedelta>" << std::endl;
        std::cerr << "Make sure statsDirOut hsa a / as it's last character. AND DIRECTORY MUST EXIST" << std::endl;
        return -1;
    }

    // Store the arguments
    const char* map = argv[1];
    const char* carTree = argv[2];
    const char* bikeTree = argv[3];
    const char* agentsIn = argv[4];
    const float statsLogInterval = std::atof(argv[5]);
    const char* agentsOut = argv[6];
    const char* statsDirOut = argv[7];
    const float runtime = std::atof(argv[8]);
    const float deltaTime = std::atof(argv[9]);

    // Declare the world
    world_t world;
    nlohmann::json import;

    if (!loadFile(map, &import)) {
        return -1;
    }

    // Import Map
    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    importMap(&world, &import);
    stopMeasureTime(start);

    // Import the SPTs
    spt_t carsSPT;
    spt_t bikeSPT;
//    std::vector<spt_t> SPTs = {carsSPT, bikeSPT};
//    std::vector<const char*> SPTFiles = {carTree, bikeTree};
//    std::vector<bool> succsss = {false, false};

    start = startMeasureTime("importing shortest path trees");
    // Don't continue if loading fails.
    if (!binLoadTree(&carsSPT, carTree, &world)){
        return -1;
    }
    if (!binLoadTree(&bikeSPT, bikeTree, &world)){
        return -1;
    }
    stopMeasureTime(start);

#ifdef DDEBUG
    for (auto iter : world.string_to_int){
        std::cout << iter.first << " " << iter.second << std::endl;
    }
    std::cout <<  std::endl;
    for (auto iter : world.int_to_string){
        std::cout << iter.first << " " << iter.second  << std::endl;
    }
    for (auto iter : world.streets){
        std::cout << iter.start << " " << iter.end << " " << iter.length  << std::endl;
    }
#endif
// TODO parallelize import
//#pragma omp parallel for default(none) shared(SPTs, SPTFiles, world, succsss)
//    for (int i = 0; i < 2; ++i){
//        succsss.at(i) = binLoadTree(SPTs[i], SPTFiles[i], world);
//    }
//
//    if (!succsss[0] || !succsss[1]){
//        return -1;
//    }

    // DEBUGGING PRINT
#ifdef DDBEUG
    std::cout << "Car Tree" << std::endl;
    printSPT(&carsSPT);
    std::cout << "Bike Tree" <<std::endl;
    printSPT(&bikeSPT);
#endif
    // Scope so json gets destroyed.
    // Import the agents.
    {
        nlohmann::json agents;
        start = startMeasureTime("importing actors");
        if (!loadFile(agentsIn, &agents)) {
            return -1;
        }
        importAgents(&world, &agents, &carsSPT, &bikeSPT);
        stopMeasureTime(start);
    }

//    int randomCars = 2000;
//    int randomBikes = 2000;
//    world.actors = std::vector<Actor*>(randomCars + randomBikes);
//    createRandomActors(world, carsSPT, ActorTypes::Car, 30, 120, 0, randomCars, 4.5f, static_cast<int>(runtime * 0.5));
//    createRandomActors(world, bikeSPT, ActorTypes::Bike, 10, 25, randomCars, randomBikes, 1.5f, static_cast<int>(runtime * 0.5));

    // Export the world.
    nlohmann::json output;
    output = exportWorld(&world, runtime, deltaTime, &import["peripherals"]["map"]);

    // Sort the Cars in the intersections
    start = startMeasureTime("sorting actors in intersections");

    #pragma omp parallel for shared(world) default(none)
    for (int i = 0; i < world.intersections.size(); ++i){
        Intersection *iter = &world.intersections.at(i);
        std::sort(iter->waitingToBeInserted.begin(), iter->waitingToBeInserted.end(), [](const Actor* a, const Actor* b){
            return a->insertAfter < b->insertAfter;
        });
    }
    stopMeasureTime(start);

    // Simulate everything
    start = startMeasureTime(
            "running simulation with\n\t" +
            std::to_string(world.intersections.size()) + " intersections\n\t" +
            std::to_string(world.streets.size()) + " streets\n\t" +
            std::to_string(world.actors.size()) + " actors\n\t" +
            std::to_string(runtime) + " seconds of runtime\n\t" +
            std::to_string(deltaTime) + " seconds precision time step"
    );

	float maxTime = runtime;
    float lastStatusTime = runtime;
    float lastStatsTime = runtime;
    float lastDeadLockTime = runtime;
//    bool emptyness = false;
//    bool current_emptyness = false;
    std::cout << std::endl;
    while (maxTime > 0.0f) {
        updateIntersections(&world, deltaTime, USE_STUPID_INTERSECTIONS, runtime - maxTime);
        lastDeadLockTime = (updateStreets(&world, deltaTime)) ? maxTime : lastDeadLockTime;

        // Longer than 20s so every road should have had green once
        if  (lastDeadLockTime - maxTime > 20.0f){
            std::cerr << "Deadlock detected at Time " << maxTime << std::endl;
            resolveDeadLocks(&world, maxTime);
            lastDeadLockTime = maxTime;
        }
		maxTime -= deltaTime;

        // Status messsage to tell me how far the simulation  has come along
        if (lastStatusTime - maxTime > STATUS_UPDATAE_INTERVAL){
            lastStatusTime = maxTime;
            std::cout << "\rTime to simulate:  " << maxTime << " remaining seconds" << std::flush;
        }
#ifdef ADD_INCREMENTS
        addFrame(&world, &output, false);
#endif
        // Dump stats to file if time has passed
        if (lastStatsTime - maxTime > statsLogInterval){
            lastStatsTime = maxTime;
            std::string statsFile = statsDirOut + std::to_string(runtime - maxTime) + ".json";
            nlohmann::json stats;
            jsonDumpStats(statsLogInterval, &stats, &world, false);
            save(statsFile, &stats);
        }

        /*mptyness = emptynessOfStreets(&world);
        if (emptyness != current_emptyness){
            current_emptyness = emptyness;
            std::cout << "Emptyness of streets: " << emptyness << std::endl;
        }*/
	}
    // Committing final state of simulation to output, required for the start and stop time.
    std::cout << std::endl;
    addFrame(&world, &output, true);
	stopMeasureTime(start);

    start = startMeasureTime("saving agents");
    save(agentsOut, &output);

    // Saving final state of the map.
    std::string statsFile = std::string(statsDirOut) + "final.json";
    nlohmann::json stats;
    jsonDumpStats(statsLogInterval, &stats, &world, true);
    save(statsFile, &stats);

	stopMeasureTime(start);

	return 0;
}