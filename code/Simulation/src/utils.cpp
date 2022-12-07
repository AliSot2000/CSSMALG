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
// #include <omp.h>

// TODO Parallel actor generation is generating a segfault when inserting the actors into the intersections.
int randint(int min, int max) {
    return std::rand() % (max - min + 1) + min;
}

void choseRandomPath(const world_t& world, spt_t& spt, int& start, int& end) {
    if (world.intersections.size() == 0) {
        std::cerr << "There are no intersections." << std::endl;
        return;
    }
    start = randint(0, world.intersections.size() - 1);
    end = start;
    int antiInfinitLoop = 0;
    while (end == start && antiInfinitLoop < 100) {
        end = randint(0, world.intersections.size() - 1);
        ++antiInfinitLoop;
    }
}

void createRandomActors(world_t& world, spt_t& spt, const ActorTypes type, const int minSpeed, const int maxSpeed,
                        const int& start, const int& numberOfActors, const float length, const int max_start_time) {
// #pragma omp parallel for default(none) shared(world, spt, type, minSpeed, maxSpeed, start, numberOfActors, length, max_start_time)
    for (int i = start;  i < start + numberOfActors; ++i) {
        Actor* actor = new Actor();
        actor->type = type;
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = length;
        actor->max_velocity = static_cast<float>(randint(minSpeed, maxSpeed)) * 0.277778f; // 30km/h to 80km/h
//        actor->width = 1.5f;
        actor->insertAfter = static_cast<float>(randint(0, max_start_time));
        actor->id = std::to_string(std::rand());

//        Actor actor = {
//                .type = type,
//                .distanceToIntersection = 0.0f,
//                .distanceToRight = 0,
//                .length = length,
//                .max_velocity = static_cast<float>(randint(minSpeed, maxSpeed)) * 0.277778f, // 30km/h to 80km/h
//                //.width = 1.5f,
//                .insertAfter = static_cast<float>(randint(0, max_start_time)),
//                .id = std::to_string(std::rand())
//        };


        int start_id;
        int end_id;
        choseRandomPath(world, spt, start_id, end_id);
        actor->path = retrievePath(spt, start_id, end_id, spt.size);

        for (auto& intersection : world.intersections) {
            if (intersection.id == start_id) {
                intersection.waitingToBeInserted.push_back(actor);
                break;
            }
        }
        world.actors.at(i) = actor;
    }
}


std::chrono::high_resolution_clock::time_point startMeasureTime(const std::string &task) {
    std::cout << "Starting task: " << task << std::endl;
    return std::chrono::high_resolution_clock::now();
}

void stopMeasureTime(std::chrono::high_resolution_clock::time_point start_time) {
    std::cout << "Last task took " << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::high_resolution_clock::now() - start_time).count() / 1000.f << " seconds.\n\n" << std::endl;
}