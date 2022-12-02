//
// Created by alisot2000 on 02.12.22.
//
#include <iostream>
#include <iomanip>
#include <vector>
#include <cstdlib>
#include <string>
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"

int randint(int min, int max) {
    return std::rand() % (max - min + 1) + min;
}

void choseRandomPath(const world_t& world, SPT& spt, std::string& start, std::string& end) {
    if (world.crossings.size() == 0) {
        std::cerr << "There are no crossings." << std::endl;
        return;
    }
    int len = (int)world.crossings.size() - 1;
    SPT::iterator startIter = spt.begin();
    std::advance(startIter, randint(0, len));
    int noFinityLoop = 0;
    while (startIter->second.size() < 2 && noFinityLoop <= world.crossings.size()) {
        startIter = spt.begin();
        std::advance(startIter, randint(0, len));
        noFinityLoop++;
    }

    if (noFinityLoop > world.crossings.size()) {
        std::cerr << "There exists no paths. Meaning one can only go from a intersection to the intersection itself." << std::endl;
        return;
    }

    auto endIter = startIter->second.begin();
    std::advance(endIter, randint(0, (int)startIter->second.size() - 1));

    if (endIter->first == startIter->first) {
        endIter = startIter->second.begin();
        if (endIter->first == startIter->first)
            endIter = std::next(endIter);
    }

    start = startIter->first;
    end = endIter->first;
}

void createRandomActors(world_t& world, SPT& spt, const ActorTypes type, const int minSpeed, const int maxSpeed,
                        const std::vector<Actor>::iterator& start, const std::vector<Actor>::iterator& end, const float length, const int max_start_time) {
    for (std::vector<Actor>::iterator iter = start; iter != end; iter++) {
        Actor actor = {
                .type = type,
                .distanceToCrossing = 0.0f,
                .distanceToRight = 0,
                .length = length,
                .max_velocity = static_cast<float>(randint(minSpeed, maxSpeed)) * 0.277778f, // 30km/h to 80km/h
                //.width = 1.5f,
                .insertAfter = static_cast<float>(randint(0, max_start_time)),
                .id = std::to_string(std::rand())
        };


        std::string start_id;
        std::string end_id;
        choseRandomPath(world, spt, start_id, end_id);
        actor.path = retrievePath(spt, start_id, end_id);

        for (auto& crossing : world.crossings) {
            if (crossing.id == start_id) {
                crossing.waitingToBeInserted.push_back(&(*iter));
                break;
            }
        }
        *iter = actor;
    }
}


std::chrono::high_resolution_clock::time_point startMeasureTime(const std::string &task) {
    std::cout << "Starting task: " << task << std::endl;
    return std::chrono::high_resolution_clock::now();
}

void stopMeasureTime(std::chrono::high_resolution_clock::time_point start_time) {
    std::cout << "Last task took " << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::high_resolution_clock::now() - start_time).count() / 1000.f << " seconds.\n\n" << std::endl;
}