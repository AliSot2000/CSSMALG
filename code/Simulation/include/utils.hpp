//
// Created by alisot2000 on 02.12.22.
//

#ifndef CSSMALG_UTILS_H
#define CSSMALG_UTILS_H

#include "actors.hpp"
#include "routing.hpp"
#include <chrono>
/*
    Gives a pseudo random number in integer range [min:max]?

    @param min, minimum of range
    @param max, maximum of range
 */
int randint(int min, int max);
/*
    Given the World and the SPT, returnes a random path starting at start, and ending in  end.

    @param world, world from which to choose start and end
    @param spt, Shortest Path Tree to use for Start and end (To make sure path exists)
    @param start, id of start vertex
    @param end, id of end vertex

    @returns void, Everything over passed by reference.

*/
void choseRandomPath(const world_t& world, spt_t& spt, int& start, int& end);
/*
    Function populates the actors of the world.

    @param world, world on which to operate
    @param spt, Shortest Path to retrieve the path
    @param type, weather actor is bike or car
    @param minSpeed, minimum speed the actor can have as max speed
    @param maxSpeed, maximum speed the actor can have as max speed
    @param start, where in actors vector to start adding new actors
    @param end, where to stop adding new actors to the vector
    @param length, length of the new actors
    @param max_start_time, maximum time into the simulation when an actor may be spawned into a intersection.

    @returns void, everything over reference
*/
void createRandomActors(world_t& world, spt_t& spt, const ActorTypes& type, const int& minSpeed, const int& maxSpeed,
                        const int& start, const int& numberOfActors, const float& length, const int& max_start_time);
/*
    Prints a start message to cout and returns the start time.

    @param task, changes the cout message

    @returns the start time
*/
std::chrono::high_resolution_clock::time_point startMeasureTime(const std::string &task);
/*
    Given a Start time, prints a message to cout about how long the last task took.

    @param start_time, time when the last task started computationl

    @returns void.
*/
void stopMeasureTime(std::chrono::high_resolution_clock::time_point start_time);
#endif //CSSMALG_UTILS_H
