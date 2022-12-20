/*
This C++ program is a traffic simulation that takes in various arguments such as the map file,
shortest path trees for cars and bikes, and input and output files for agents and statistics.
It starts by importing the map and shortest path trees, and then creates actors based on the input file.
It then simulates the movement of the actors in the world for a given runtime,
while keeping track of various statistics such as average speed and number of collisions.
The program also has options for enabling traffic signals and for updating statistics at a specific interval.
At the end of the simulation, it exports the final state of the agents and the accumulated statistics to the specified output files.
*/

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
#include <cassert>

#define STATUS_UPDATAE_INTERVAL 60
#define USE_STUPID_INTERSECTIONS false
#define SLURM_OUTPUT

int main(int argc, char* argv[]) {
    assert(false && "Sanity checking with compiilers that asserts are still there with -O3"); // Comment for debugging
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
    bool do_traffic_signals = false;

    if (argc > 9){
        do_traffic_signals = (*argv[10] == '1');
    }

    std::cout << "Simulaton is doing traffic signals? " << do_traffic_signals << std::endl;

    // Declare the world
    world_t world;
    nlohmann::json import;

    if (!loadFile(map, &import)) {
        return -1;
    }

    // Import Map
    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    importMap(&world, &import, do_traffic_signals);
    stopMeasureTime(start);

    // Import the SPTs
    spt_t carsSPT;
    spt_t bikeSPT;

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

        // Longer than 20s so every road should havruntime - maxTimee had green once
        if  (lastDeadLockTime - maxTime > 15.0f){
            std::cerr << "Deadlock detected at Time " << maxTime << std::endl;
            resolveDeadLocks(&world, runtime - maxTime);
            lastDeadLockTime = maxTime;
        }
		maxTime -= deltaTime;

        // Status messsage to tell me how far the simulation  has come along
        if (lastStatusTime - maxTime >= STATUS_UPDATAE_INTERVAL){
            lastStatusTime = maxTime;
#ifdef SLURM_OUTPUT
            std::cout << "Time to simulate:  " << maxTime << " remaining seconds" << std::endl;
#else
            std::cout << "\rTime to simulate:  " << maxTime << " remaining seconds" << std::flush;
#endif
        }
#ifdef ADD_INCREMENTS
        addFrame(&world, &output, false);
#endif
        // Dump stats to file if time has passed
        if (lastStatsTime - maxTime >= statsLogInterval){
            lastStatsTime = maxTime;
            std::string statsFile = statsDirOut + std::to_string(runtime - maxTime) + ".json";
            nlohmann::json stats;
            jsonDumpStats(statsLogInterval, &stats, &world, false);
            save(statsFile, &stats);
        }

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