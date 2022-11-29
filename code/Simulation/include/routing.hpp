#pragma once

#include <map>

#include "actors.hpp"

/*
	Inspired by https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm#Path_reconstruction
*/

typedef std::map<std::string, std::map<std::string, std::string>> SPT; // Shortest Path Tree C++ struct

/*
 * Calculates the shortest path tree for the given world using Floyd-Warshall
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
