#pragma once

#include <map>
#include "actors.hpp"
#define USE_CUDA
//#define ALTFW
// The option alt fw uses a different weight for  the edges in the graph during the floyd warshall computation.
// This was done to debug an error. It might also be useful for testing different configurations.
// Enabeling this option changes the weight of an edge from the length of a road to the length of a road divided by the speed limit and the width of the road.
// d = length / (velocity * width)

typedef struct SPT {
    int* array;
    int size;
} spt_t;

/*
 * Calculates the shortest path tree for the given world.
 *
 * @param world The world to calculate the shortest path tree for.
 * @param include The types of streets to include in the calculation.
 *
 * @return The shortest path tree.
 */
spt_t calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include);

/*
 * Retrieves the path from start to end.
 *
 * @param spt The shortest path tree.
 * @param start The start of the path, string_id from the web_interface.
 * @param end The end of the path, string_id from the web_interface.
 *
 * @return The path from start to end.
 */
Path retrievePath(spt_t* spt, const int &start, const int &end);

/**

Calculates the distance of an actor from its path.
@param world A pointer to the world object.
@param actor A pointer to the actor object.
@return The distance of the actor from its path.
*/
float distanceFromPath(const world_t* world, actor_t* actor);

/**

Calculates the path of an actor in the world.
@param actor A pointer to the actor object.
@param world A pointer to the world object.
@return A vector of strings representing the IDs of the streets in the actor's path.
*/
std::vector<std::string> getPath(actor_t* actor, const world_t* world);

/**

Calculates the path of an actor on a single street.
@param actor A pointer to the actor object.
@param world A pointer to the world object.
@return A vector of strings representing the IDs of the streets in the actor's path.
*/
std::vector<std::string> StreetPath(actor_t* actor, const world_t* world);