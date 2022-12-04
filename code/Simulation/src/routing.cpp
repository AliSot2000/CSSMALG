
#include "routing.hpp"

#include <iostream>
#include <algorithm>


lookup_t BuildLookup(const world_t* world){
    LookUp result{};
    int index = 0;

    for (auto iter : world->intersections){
        result.int_to_string[index] = iter.id;
        result.string_to_int[iter.id] = index;
        index++;
    }

    return result;
}

// Idea: If a road has multiple turning lanes, split a intersection into sets of identical turn options and split the single
// Intersection vertex into multiple vertecies representing the intersection with each new vertex only containing roads with
// identical turning sets.

// Compute Floyd-Warshal on entire graph to find the shortest path from a to b.
SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include) {
	const size_t n = world->intersections.size();

	std::map<std::string, std::map<std::string, float>> minimumDistance;
	SPT spt;

    // initialize the value of the map with empty maps.
	for (const auto& intersection : world->intersections) {
		minimumDistance[intersection.id] = std::map<std::string, float>();
	}

	for (const auto& street : world->streets) {
		if (std::find(include.begin(), include.end(), street.type) != include.end()) {
			minimumDistance[street.start][street.end] = street.length;
			spt[street.start][street.end] = street.end;
		}
	}

	for (const auto& intersection : world->intersections) {
		minimumDistance[intersection.id][intersection.id] = 0;
		spt[intersection.id][intersection.id] = intersection.id;
	}

	for (int32_t k = 0; k < n; k++) {
        std::cout << "Computing " << k << " of " << n << std::endl;
		std::string ks = world->intersections[k].id;
		for (int32_t i = 0; i < n; i++) {
			std::string is = world->intersections[i].id;
			for (int32_t j = 0; j < n; j++) {
				std::string js = world->intersections[j].id;

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

/*
SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include){
    LookUp lu = BuildLookup(world);

    // Allocating Memory for the distance and optimal neighbour
    void *Udistance;
    void *UNeighbour;
    int size = lu.string_to_int.size();

    cudaMallocManaged(&Udistance, size*size*sizeof(double));
    cudaMallocManaged(&UNeighbour, size*size*sizeof(int));

    double *distance = static_cast<double*>(Udistance);
    int *neighbour = static_cast<int*>(UNeighbour);

    for (int start = 0; start < size; start++){
        for (int end = 0; end < size; end++) {
            *(distance + start * size + end) = 10e30; // Initializing the
        }
    }
    SPT res = SPT {};
    return res;

}
*/
Path retrievePath(SPT& spt, const std::string &start, const std::string &end) {
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