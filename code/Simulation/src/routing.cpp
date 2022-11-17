
#include "routing.hpp"

#include <iostream>

SPT calculateShortestPathTree(const world_t* world) {
	const size_t n = world->crossings.size();

	std::map<std::string, std::map<std::string, float>> minimumDistance;
	SPT spt;

	for (const auto& crossing : world->crossings) {
		minimumDistance[crossing.id] = std::map<std::string, float>();
	}

	for (const auto& street : world->streets) {
		minimumDistance[street.start][street.end] = street.length;
		spt[street.start][street.end] = street.end;
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

				if (hasEdge && (!spt[is].contains(js) || minimumDistance[is][js] > minimumDistance[is][ks] + minimumDistance[ks][js])) {
					minimumDistance[is][js] = minimumDistance[is][ks] + minimumDistance[ks][js];
					spt[is][js] = spt[is][ks];
				}
			}
		}
	}

	return spt;
}

Path retrievePath(SPT& spt, const std::string start, const std::string end) {
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