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
    if (argc < 2) {
        std::cerr << "Usage PrecalculateSPT <map-in> <spt-out>" << std::endl;
        std::cerr << "Function precalculates the spt" << std::endl;
        return -1;
    }

    const char* importFile = argv[1];
    const char* outputFile = argv[2];

    world_t world;
    nlohmann::json import;

    if (!loadFile(importFile, import)) {
        return -1;
    }

    std::chrono::high_resolution_clock::time_point time = startMeasureTime("importing map");
    importMap(world, import);
    stopMeasureTime(time);

    startMeasureTime("calculating shortest path tree with floyd warshall");
    SPT carsSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyCar});
    SPT bikeSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyBike });

    nlohmann::json spts;
    exportSPT(carsSPT, bikeSPT, import, spts);
    save(outputFile, spts);
}

