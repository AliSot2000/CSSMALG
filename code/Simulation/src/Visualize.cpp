/*
This is a simulation program that simulates the movement of cars and bikes on a map using the provided shortest path trees (SPT).
The program first reads in the map file and generates the SPT for cars and bikes if it has not been precomputed.
It then creates a specified number of random actors (cars and bikes) and assigns them to starting locations and destinations on the map.
The program then runs a simulation for a specified runtime,
with each step of the simulation updating the positions of the actors based on their current locations,
destinations, and the shortest paths to their destinations. The program also tracks and outputs statistics about the simulation,
such as the average speed of the actors and the average waiting time at traffic lights. At the end of the simulation,
the program saves the positions and destinations of the actors to an output file.
*/


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

#define USE_STUPID_INTERSECTIONS false
#define STATUS_UPDATAE_INTERVAL 60
#define DO_TRAFFIC_SIGNALS true
#define DDEBUG

int main(int argc, char* argv[])
{
    if (argc < 7) {
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
    const char* agentsFile = ((argc == 8)) ? argv[8] : nullptr;

    if (argc == 9) {
        stupidIntersections = (*argv[8] == '1');
    }

    world_t world;
    nlohmann::json import;

    if (!loadFile(importFile, &import)) {
        return -1;
    }

    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    if (hasPrecompute(&import)) {
        importMap(&world, &import["world"], DO_TRAFFIC_SIGNALS);
    }
    else {
        importMap(&world, &import);
    }
    stopMeasureTime(start);

    spt_t carsSPT;
    spt_t bikeSPT;

    if (hasPrecompute(&import)) {
        start = startMeasureTime("calculating shortest path tree with floyd warshall");
        importSPT(&carsSPT, &bikeSPT, &import, &world);
        stopMeasureTime(start);
    }
    else {
        start = startMeasureTime("calculating shortest path tree with floyd warshall");
        carsSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyCar});
        bikeSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyBike});
        stopMeasureTime(start);
    }
#ifdef DDEBUG
    std::cout << "Car Tree" << std::endl;
    printSPT(&carsSPT);
    std::cout << "Bike Tree" <<std::endl;
    printSPT(&bikeSPT);
#endif
    start = startMeasureTime("creating random actors");

    if (agentsFile != nullptr) {

        nlohmann::json agents;
        if (!loadFile(agentsFile, &agents)) {
            return -1;
        }

        importAgents(&world, &agents, &carsSPT, &bikeSPT);
    }
    else {
        world.actors = std::vector<Actor*>(randomCars + randomBikes);
        createRandomActors(&world, &carsSPT, ActorTypes::Car, 30, 120, 0, randomCars, 4.5f, static_cast<int>(runtime * 0.5));
        createRandomActors(&world, &bikeSPT, ActorTypes::Bike, 10, 25, randomCars, randomBikes, 1.5f, static_cast<int>(runtime * 0.5));
    }

    stopMeasureTime(start);

    nlohmann::json output;
    if (hasPrecompute(&import)) {
        output = exportWorld(&world, runtime, deltaTime, &import["world"]["peripherals"]["map"]);
    }
    else {
        output = exportWorld(&world, runtime, deltaTime, &import["peripherals"]["map"]);
    }

    start = startMeasureTime("sorting actors in intersections");
    for (intersection_t& iter : world.intersections) {
        std::sort(iter.waitingToBeInserted.begin(), iter.waitingToBeInserted.end(), [](const Actor* a, const Actor* b) {
            return a->insertAfter < b->insertAfter;
        });
    }
    stopMeasureTime(start);

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
    float lastDeadLockTime = runtime;
    while (maxTime > 0.0f) {
        updateIntersections(&world, deltaTime, stupidIntersections, runtime - maxTime);
        lastDeadLockTime = (updateStreets(&world, deltaTime)) ? maxTime : lastDeadLockTime;

        // Longer than 20s so every road should have had green once
        if  (lastDeadLockTime - maxTime > 15.0f) {
            std::cerr << "Deadlock detected at Time " << maxTime << std::endl;
            resolveDeadLocks(&world, runtime - maxTime);
            lastDeadLockTime = maxTime;
        }
        maxTime -= deltaTime;

        // Status messsage to tell me how far the simulation  has come along
        if (lastStatusTime - maxTime >= STATUS_UPDATAE_INTERVAL) {
            lastStatusTime = maxTime;
#ifdef SLURM_OUTPUT
            std::cout << "Time to simulate:  " << maxTime << " remaining seconds" << std::endl;
#else
            std::cout << "\rTime to simulate:  " << maxTime << " remaining seconds" << std::flush;
#endif
        }
        addFrame(&world, &output);
    }
    // Committing final state of simulation to output, required for the start and stop time.
    std::cout << std::endl;
    addFrame(&world, &output, true);
    stopMeasureTime(start);

    start = startMeasureTime("saving simulation");

    save(outputFile, &output);

    stopMeasureTime(start);

    return 0;
}
