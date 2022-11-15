#pragma once;

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

typedef std::vector<std::vector<int32_t>> SPT;

std::vector<std::vector<int32_t>> calculateShortestPathTree(const world_t* world);
std::queue<int32_t> retrievePath(const SPT & spt, const int32_t start, const int32_t end);
