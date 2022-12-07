#pragma once

#include <map>
#include "actors.hpp"
// #define USE_CUDA

/*
	Inspired by https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm#Path_reconstruction

	Demo taken from wikipedia, results in correct path being chosen.

	world_t world;

	world.intersections = std::vector<Intersection>(4);
	world.streets = std::vector<Street>(5);

	world.intersections[0].id = 0;
	world.intersections[1].id = 1;
	world.intersections[2].id = 2;
	world.intersections[3].id = 3;

	world.streets[0].start = 0;
	world.streets[0].end = 2;
	world.streets[0].length = -2.0f;

	world.streets[1].start = 2;
	world.streets[1].end = 3;
	world.streets[1].length = 2.0f;

	world.streets[2].start = 3;
	world.streets[2].end = 1;
	world.streets[2].length = -1.0f;

	world.streets[3].start = 1;
	world.streets[3].end = 0;
	world.streets[3].length = 4.0f;

	world.streets[4].start = 1;
	world.streets[4].end = 2;
	world.streets[4].length = 3.0f;

	SPT spt = calculateShortestPathTree(&world);
	std::queue<int32_t> path = retrievePath(spt, 3, 2);

	while (!path.empty()) {
		int32_t step = path.front();
		std::cout << "Step: " << step << std::endl;
		path.pop();
	}
*/

typedef struct SPT{
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
Path retrievePath(spt_t& spt, const int &start, const int &end);
