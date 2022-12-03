#pragma once

#include <map>
#include "actors.hpp"

/*
	Inspired by https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm#Path_reconstruction

	Demo taken from wikipedia, results in correct path being chosen.

	world_t world;

	world.crossings = std::vector<Crossing>(4);
	world.streets = std::vector<Street>(5);

	world.crossings[0].id = 0;
	world.crossings[1].id = 1;
	world.crossings[2].id = 2;
	world.crossings[3].id = 3;

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

typedef std::map<std::string, std::map<std::string, std::string>> SPT;

typedef struct LookUp {
    std::map<std::string, int> string_to_int;
    std::map<int, std::string> int_to_string;
} lookup_t;

lookup_t BuildLookup(const world_t* world);

/*
 * Calculates the shortest path tree for the given world.
 *
 * @param world The world to calculate the shortest path tree for.
 * @param include The types of streets to include in the calculation.
 *
 * @return The shortest path tree.
 */
SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include);

/*
 * Retrieves the path from start to end.
 *
 * @param spt The shortest path tree.
 * @param start The start of the path, string_id from the web_interface.
 * @param end The end of the path, string_id from the web_interface.
 *
 * @return The path from start to end.
 */
Path retrievePath(SPT& spt, const std::string &start, const std::string &end);
