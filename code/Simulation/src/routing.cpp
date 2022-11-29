
#include "routing.hpp"

#include <iostream>
#include <algorithm>

SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include) {
	const size_t n = world->crossings.size();

	std::map<std::string, std::map<std::string, float>> minimumDistance;
	SPT spt;

    // initialize the value of the map with empty maps.
	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id] = std::map<std::string, float>();
	}

	// Insert all beginning vertices
	for (const auto& street : world->streets) {
		if (std::find(include.begin(), include.end(), street.type) != include.end()) {
			minimumDistance[street.start][street.end] = street.length;
			spt[street.start][street.end] = street.end;
		}
	}

	// Self to self should always be the shortest path
	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id][crossing.id] = 0;
		spt[crossing.id][crossing.id] = crossing.id;
	}

	// Floyd-Warshall Implementation
	for (int32_t k = 0; k < n; k++) {
		std::string ks = world->crossings[k].id;

		for (int32_t i = 0; i < n; i++) {
			std::string is = world->crossings[i].id;

			for (int32_t j = 0; j < n; j++) {
				std::string js = world->crossings[j].id;

				// Check if there even is a path
				bool hasEdge = spt[is].contains(ks) && spt[ks].contains(js);

				// Check if other path would be shorter
				if (hasEdge && (!spt[is].contains(js) || minimumDistance[is][js] > minimumDistance[is][ks] + minimumDistance[ks][js])) {
					minimumDistance[is][js] = minimumDistance[is][ks] + minimumDistance[ks][js];
					spt[is][js] = spt[is][ks];
				}
			}
		}
	}

	return spt;
}

Path retrievePath(SPT& spt, const std::string &start, const std::string &end) {

	if (!spt[start].contains(end)) {
		// No path exists
		return Path();
	}

	Path p;

	// Start is not included, otherwise p.push(start)

	// Reverse path lookup
	std::string u = start;
	while (u != end) {
		u = spt[u][end];
		p.push(u);
	}

	return p;
}