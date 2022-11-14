#pragma once;

#include "actors.hpp"

/*
	Inspired by https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm#Path_reconstruction
*/

typedef std::vector<std::vector<int32_t>> SPT;

std::vector<std::vector<int32_t>> calculateShortestPathTree(const world_t* world);
std::queue<int32_t> retrievePath(const SPT & spt, const int32_t start, const int32_t end);
