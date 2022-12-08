//
// Created by alisot2000 on 07.12.22.
//
#include <iostream>
#include <vector>
#include <cstdlib>
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"
#include "io.hpp"
#include "utils.hpp"

#define STATUS_UPDATAE_INTERVAL 3600

// TODO Add ability to output stats..
int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cerr << "Usage CSSMALG <map-in> <n-random-cars> <n-random-bikes> <agents-file> <max-random-time>" << std::endl;
        return -1;
    }

    const char* importFile = argv[1];
    const char* outputFile = argv[4];
    const int randomCars = std::atoi(argv[2]);
    const int randomBikes = std::atoi(argv[3]);
    const int maxRandomTime = std::atoi(argv[5]);

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
        bikeSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyBike});
        carsSPT = calculateShortestPathTree(&world, {StreetTypes::Both, StreetTypes::OnlyCar});
        stopMeasureTime(start);
    }


    for (auto iter : world.string_to_int){
        std::cout << iter.first << " " << iter.second << std::endl;
    }
    std::cout <<  std::endl;
    for (auto iter : world.int_to_string){
        std::cout << iter.first << " " << iter.second << std::endl;
    }
    start = startMeasureTime("creating random actors");
    world.actors = std::vector<Actor*>(randomCars + randomBikes);
    createRandomActors(world, bikeSPT, ActorTypes::Bike, 10, 25, 0, randomBikes, 1.5f, maxRandomTime);
    createRandomActors(world, carsSPT, ActorTypes::Car, 30, 120, randomBikes, randomCars, 4.5f, maxRandomTime);
    stopMeasureTime(start);

    json actorOut;
    exportAgents(actorOut, world);
    save(outputFile, actorOut);
    return 0;
}