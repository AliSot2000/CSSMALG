
#include "routing.hpp"

#include <iostream>
#include <algorithm>

// Idea: If a road has multiple turning lanes, split a crossing into sets of identical turn options and split the single
// Crossing vertex into multiple vertecies representing the crossing with each new vertex only containing roads with
// identical turning sets.

// Compute Floyd-Warshal on entire graph to find the shortest path from a to b.
SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include) {
	const size_t n = world->crossings.size();

	std::map<std::string, std::map<std::string, float>> minimumDistance;
	SPT spt;

    // initialize the value of the map with empty maps.
	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id] = std::map<std::string, float>();
	}

	for (const auto& street : world->streets) {
		if (std::find(include.begin(), include.end(), street.type) != include.end()) {
			minimumDistance[street.start][street.end] = street.length;
			spt[street.start][street.end] = street.end;
		}
	}

	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id][crossing.id] = 0;
		spt[crossing.id][crossing.id] = crossing.id;
	}

	for (int32_t k = 0; k < n; k++) {
		std::string ks = world->crossings[k].id;
		for (int32_t i = 0; i < n; i++) {
			std::string is = world->crossings[i].id;
			for (int32_t j = 0; j < n; j++) {
				std::string js = world->crossings[j].id;

				bool hasEdge = spt[is].contains(ks) && spt[ks].contains(js);
                // Check if the two edges is-ks, ks-js are valid.
                // If the nodes is, js are not connected, connect them, else update the value if the connections is shorter.
				if (hasEdge && (!spt[is].contains(js) || minimumDistance[is][js] > minimumDistance[is][ks] + minimumDistance[ks][js])) {
					minimumDistance[is][js] = minimumDistance[is][ks] + minimumDistance[ks][js];
					spt[is][js] = spt[is][ks];
				}
			}
		}
	}

	return spt;
}

Path retrievePath(const SPT& spt, const std::string &start, const std::string &end) {
	if (!spt[start].contains(end)) {
		return Path();
	}

	Path p;
	// p.push(start);

	std::string u = start;
	while (u != end) {
		u = spt[u][end];
		p.push(u);
	}
	return p;
}