/*

This C++ program is a traffic simulation that imports a map,
calculates shortest path trees for cars and bikes,
and creates random actors (vehicles) in the simulation.
It also has options for pre-computing the shortest path trees and importing them from binary files.
The program also has a function for exporting the actors to a JSON file.
The program takes in several command line arguments: the input map file,
the number of random cars to generate, the number of random bikes to generate,
the output file for the actors, the maximum random time for the actors,
and (optionally) the binary files for the pre-computed shortest path trees for cars and bikes.
*/


#include <iostream>
#include <vector>
#include <cstdlib>
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"
#include "io.hpp"
#include "utils.hpp"
// #define DDEBUG

int main(int argc, char* argv[])
{
    if (argc < 4) {
        std::cerr << "Usage CSSMALG <map-in> <n-random-cars> <n-random-bikes> <agents-file> <max-random-time> <carSPT> <bikeSPT>" << std::endl;
        return -1;
    }

    const char* importFile = argv[1];
    const char* outputFile = argv[4];
    const int randomCars = std::atoi(argv[2]);
    const int randomBikes = std::atoi(argv[3]);
    const int maxRandomTime = std::atoi(argv[5]);

    world_t world;
    nlohmann::json import;

    if (!loadFile(importFile, &import)) {
        return -1;
    }

    std::chrono::high_resolution_clock::time_point start = startMeasureTime("importing map");
    if (hasPrecompute(&import)) {
        importMap(&world, &import["world"]);
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
    else if (argc > 6) {
        start = startMeasureTime("importing shortest path trees");
        // Don't continue if loading fails.
        if (!binLoadTree(&carsSPT, argv[6], &world)) {
            return -1;
        }
        if (!binLoadTree(&bikeSPT, argv[7], &world)) {
            return -1;
        }
        stopMeasureTime(start);
    }
    else {
        start = startMeasureTime("calculating shortest path tree with floyd warshall");
        carsSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyCar});
        bikeSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyBike});
        stopMeasureTime(start);
    }

#ifdef DDEBUG
    // DEBUGGING PRINT
    std::cout << "Car Tree" << std::endl;
    printSPT(&carsSPT);
    std::cout << "Bike Tree" <<std::endl;
    printSPT(&bikeSPT);

    for (auto iter : world.string_to_int) {
        std::cout << iter.first << " " << iter.second << std::endl;
    }
    std::cout <<  std::endl;
    for (auto iter : world.int_to_string) {
        std::cout << iter.first << " " << iter.second << std::endl;
    }
#endif
    start = startMeasureTime("creating random actors");
    world.actors = std::vector<Actor*>(randomCars + randomBikes);
    createRandomActors(&world, &bikeSPT, ActorTypes::Bike, 10, 25, randomCars, randomBikes, 1.5f, maxRandomTime);
    createRandomActors(&world, &carsSPT, ActorTypes::Car, 30, 120, 0, randomCars, 4.5f, maxRandomTime);
    stopMeasureTime(start);

    json actorOut;
    exportAgents(&actorOut, &world);
    save(outputFile, &actorOut);
    return 0;
}