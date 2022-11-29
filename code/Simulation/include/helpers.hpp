
#include <string>

#include "actors.hpp"
#include "routing.hpp"

#pragma once

/*
    Creates a pseudo random integer between min and max.

    @param min minimum size
    @param max maximum size

    @return  returns pseudo random integer
*/
int randint(int min, int max);

/*
    Choses a random entry from the shortest path tree. Will fail if there are less than two crossings.
    Furthermore it is implemented to always return a path which contains atleast one street.

    @param world World containing crossings
    @param spt Precalculated shortest path tree.
    @param start Address where start crossing id will be stored
    @param end Address where end crossing id will be stored

    @returns Returns true if chosing random path succeeded.
*/
bool choseRandomPath(world_t& world, SPT& spt, std::string& start, std::string& end);

/*
    Creates random actor entries for all iterators between "start" and "end"

    @param world World where actors are stored
    @param spt Precalculated shortest path tree
    @param type Actors will be created of this type
    @param minSpeed Used for random speed calculation. Given in km/h
    @param maxSpeed Used for random speed calculation. Given in km/h
    @param start First actor which will be created
    @param end One after last actor to be created
    @param length Length of actors, will be different for cars and bikes

*/
void createRandomActors(world_t& world, SPT& spt, const ActorTypes type, const int minSpeed, const int maxSpeed,
    const std::vector<Actor>::iterator& start, const std::vector<Actor>::iterator& end, const float length);

/*
    Helper function for measuring how long a function takes.
    This function is not meant to be used in parallel.

    @param task Name of task. Will be printed to std::cout
*/
void startMeasureTime(const std::string& task);

/*
    Stops measuring time and prints resulting time.
*/
void stopMeasureTime();
