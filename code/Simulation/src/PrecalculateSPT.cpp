//
// Created by alisot2000 on 01.12.22.
//
#include <iostream>
#include <chrono>

#include "actors.hpp"
#include "nlohmann/json.hpp"
#include "utils.hpp"
#include "io.hpp"
//#define DDEBUG
//DO_TRAFFIC_SIGNALS
#define SLURM_OUTPUT


int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cerr << "Usage PrecalculateSPT <map-in> <car-out> <bike-out> <jan-out>" << std::endl;
        std::cerr << "Function precalculates the spt" << std::endl;
        return -1;
    }

    const char* importFile = argv[1];
    const char* carFile = argv[2];
    const char* bikeFile = argv[3];
    const char* janFile = argv[4];

    world_t world;
    nlohmann::json import;

    if (!loadFile(importFile, &import)) {
        return -1;
    }

    if (hasPrecompute(&import)){
        std::cout << "File containes a Precomputed SPT. No need to compute it again.";
        return 0;
    }

    std::chrono::high_resolution_clock::time_point time = startMeasureTime("importing map");
    importMap(&world, &import);
    stopMeasureTime(time);

    time = startMeasureTime("calculating shortest path tree with floyd warshall");

    spt_t carsSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyCar});
#ifdef DDEBUG
    std::cout << std::endl << "Car Tree" << std::endl;
    printSPT(&carsSPT);
#endif
    binDumpSpt(&carsSPT, carFile);

//#ifdef DDEBUG
    std::cout << std::endl << std::endl << std::endl;
//#endif
    spt_t bikeSPT = calculateShortestPathTree(&world, { StreetTypes::Both, StreetTypes::OnlyBike });
    binDumpSpt(&bikeSPT, bikeFile);
#ifdef DDEBUG
    std::cout << std::endl << "Bike Tree" <<std::endl;
    printSPT(&bikeSPT);
#endif

    stopMeasureTime(time);

    time = startMeasureTime("Exporting to file");
#ifdef SINGLE_FILE_EXPORT
    exportSPT(carsSPT, bikeSPT, import, &world, janFile);
#else
    nlohmann::json spts;
    exportSPT(carsSPT, bikeSPT, import, spts, &world);
    save(janFile, &spts);
#endif
    stopMeasureTime(time);
}

