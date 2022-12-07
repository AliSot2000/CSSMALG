//
// Created by alisot2000 on 07.12.22.
//
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
#include <omp.h>

#define STATUS_UPDATAE_INTERVAL 60
#define USE_STUPID_INTERSECTIONS false

int main(int argc, char* argv[]) {
    std::cout << "MAKE SURE THAT THE MAP MATCHES THE SPT" << std::endl;

    if (argc < 6) {
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

    if (!loadFile(map, import)) {
        return -1;
    }

    // Import the map
    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    importMap(world, import);
    stopMeasureTime(start);

    // Import the SPTs
    spt_t carsSPT;
    spt_t bikeSPT;

    start = startMeasureTime("importing shortest path trees");
    // Don't continue if loading fails.
    if (binLoadTree(carsSPT, carTree, world) && binLoadTree(bikeSPT, bikeTree, world)){
        return -1;
    }
    stopMeasureTime(start);

    // Scope so json gets destroyed.
    // Import the agents.
    {
        json agents;
        start = startMeasureTime("importing actors");
        if (!loadFile(agentsIn, agents)) {
            return -1;
        }
        importAgents(world, agents, carsSPT, bikeSPT);
        stopMeasureTime(start);
    }

    // Export the world.
    nlohmann::json output;
    output = exportWorld(world, runtime, deltaTime, import["world"]["peripherals"]["map"]);

    // Sort the Cars in the intersections
    start = startMeasureTime("sorting actors in intersections");

    #pragma omp parallel for shared(world) default(none)
    for (intersection_t& iter : world.intersections){
        std::sort(iter.waitingToBeInserted.begin(), iter.waitingToBeInserted.end(), [](const Actor* a, const Actor* b){
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
    float lastDeadLock = runtime;
    float lastStatusTime = runtime;
    float lastStatsTime = runtime;

    std::cout << std::endl;
    while (maxTime > 0.0f) {
        updateIntersections(&world, deltaTime, USE_STUPID_INTERSECTIONS, runtime - maxTime);
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
            std::cout << "\rTime to simulate:  " << maxTime << " remaining seconds";
        }

        // Dump stats to file if time has passed
        if (lastStatsTime - maxTime > statsLogInterval){
            lastStatsTime = maxTime;
            std::string statsFile = statsDirOut + std::to_string(runtime - maxTime) + ".json";
            nlohmann::json stats;
            jsonDumpStats(statsLogInterval, stats, world, false);
            save(statsFile, stats);
        }
    }
    // Committing final state of simulation to output, required for the start and stop time.
    addFrame(world, output, true);
    stopMeasureTime(start);

    start = startMeasureTime("saving agents");
    save(agentsOut, output);

    // Saving final state of the map.
    std::string statsFile = std::string(statsDirOut) + "final.json";
    nlohmann::json stats;
    jsonDumpStats(statsLogInterval, stats, world, true);
    save(statsFile, stats);

    stopMeasureTime(start);

    return 0;
}