//
// Created by alisot2000 on 01.12.22.
//

#include <iostream>
#include <string>
#include <chrono>

#include "actors.hpp"
#include "nlohmann/json.hpp"
#include "utils.hpp"
#include "io.hpp"

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage PrecalculateSPT <map-in> <spt-out>" << std::endl;
        std::cerr << "Function precalculates the spt" << std::endl;
        return -1;
    }

    const char* importFile = argv[1];
    const char* carFile = argv[2];
    const char* bikeFile = argv[3];

    world_t world;
    nlohmann::json import;

    if (!loadFile(importFile, import)) {
        return -1;
    }

    if (hasPrecompute(import)){
        std::cout << "File containes a Precomputed SPT. No need to compute it again.";
        return 0;
    }

    std::chrono::high_resolution_clock::time_point time = startMeasureTime("importing map");
    importMap(world, import);
    stopMeasureTime(time);

    time = startMeasureTime("calculating shortest path tree with floyd warshall");
    {
        spt_t carsSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyCar});
        std::cout << std::endl;
        for (int i = 0; i < carsSPT.size; i++){
            for (int j = 0; j < carsSPT.size; j++){
                std::cout << carsSPT.array[i * carsSPT.size + j] << " ";
            }
            std::cout << std::endl;
        }
        binDumpSpt(carsSPT, carFile);
    }
    {
        spt_t bikeSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyBike });
        binDumpSpt(bikeSPT, bikeFile);
        std::cout << std::endl;
        for (int i = 0; i < bikeSPT.size; i++){
            for (int j = 0; j < bikeSPT.size; j++){
                std::cout << bikeSPT.array[i * bikeSPT.size + j] << " ";
            }
            std::cout << std::endl;
        }
    }
    stopMeasureTime(time);

//    time = startMeasureTime("Exporting to file");
//    nlohmann::json spts;
    // exportSPT(carsSPT, bikeSPT, import, spts);
    // save(carFile, spts);
//    stopMeasureTime(time);
}

