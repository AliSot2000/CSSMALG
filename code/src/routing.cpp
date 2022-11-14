
#include "routing.hpp"

#include <iostream>

std::vector<std::vector<int32_t>> calculateShortestPathTree(const world_t* world) {
	const size_t n = world->crossings.size();

	std::vector<std::vector<float>> minimumDistance(n, std::vector<float>(n));

	SPT spt(n, std::vector<int32_t>(n));

	// Fill with -1 to distinguish empty entries from index 0 entries.
	for(auto& row: spt)
		std::fill(row.begin(), row.end(), -1);

	for (const auto& street : world->streets) {
		minimumDistance[street.start][street.end] = street.length;
		spt[street.start][street.end] = street.end;
	}

	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id][crossing.id] = 0;
		spt[crossing.id][crossing.id] = crossing.id;
	}

	for (int32_t k = 0; k < n; k++) {
		for (int32_t i = 0; i < n; i++) {
			for (int32_t j = 0; j < n; j++) {

				if (spt[i][k] != -1 && spt[k][j] != -1 && (spt[i][j] == -1  || minimumDistance[i][j] > minimumDistance[i][k] + minimumDistance[k][j])) {
					minimumDistance[i][j] = minimumDistance[i][k] + minimumDistance[k][j];
					spt[i][j] = spt[i][k];
				}
			}
		}
	}

	return spt;
}

std::queue<int32_t> retrievePath(const SPT& spt, const int32_t start, const int32_t end) {
	if (spt[start][end] == -1) {
		return std::queue<int32_t>();
	}

	std::queue<int32_t> path;
	path.push(start);

	int32_t u = start;
	while (u != end) {
		u = spt[u][end];
		path.push(u);
	}
	return path;
}