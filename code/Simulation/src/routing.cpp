#include "routing.hpp"

#include <iostream>
#include <algorithm>

#include "fastFW.cuh"
#define USE_CUDA

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
#ifndef USE_CUDA
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
#else

SPT calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include){
    LookUp lu = BuildLookup(world);

    // Allocating Memory for the distance and optimal neighbour
    int size = lu.string_to_int.size();

    double *distance = (double*)malloc(size * size * sizeof(double));
    int *neighbour = (int*)malloc(size * size * sizeof(int));

    // Initialize the distance and neighbour arrays
    for (int start = 0; start < size; start++){
        for (int end = 0; end < size; end++) {
            *(distance + start * size + end) = (start != end) * 1e30; // Initializing the default distance between nodes
            *(neighbour + start * size + end) = (start == end) * start + (start != end) * -1; // Initializing the default neighbour
        }
    }

    // Add Distance of Streets to the distance array
    for (const auto& street : world->streets) {
        if (std::find(include.begin(), include.end(), street.type) != include.end()) {
            int start = lu.string_to_int[street.start];
            int end = lu.string_to_int[street.end];
            // Take the shortest street in case there are multiple (for what ever reason there should be multiple
            *(distance + start * size + end) = std::min(static_cast<double>(street.length), *(distance + start * size + end));
            // spt[street.start][street.end] = street.end;
            *(neighbour + start * size + end) = end;
        }
    }

    /*
    for (int i = 0; i < size; i++){
        for (int j = 0; j < size; j++){
            std::cout << *(neighbour + i * size + j) << " ";
        }
        std::cout << std::endl;
    }
    */
    FloydWarshal(distance, neighbour, size);
    /*
    for (int i = 0; i < size; i++){
        for (int j = 0; j < size; j++){
            std::cout << *(distance + i * size + j) << " ";
        }
        std::cout << std::endl;
    }

    for (int i = 0; i < size; i++){
        for (int j = 0; j < size; j++){
            std::cout << *(neighbour + i * size + j) << " ";
        }
        std::cout << std::endl;
    }
    */
    std::cout << "Done with Floyd-Warshal - converting to map" << std::endl;
    SPT res = SPT {};

    for (int i = 0; i < size; i++){
        res[lu.int_to_string[i]] = std::map<std::string, std::string> ();

        for (int j = 0; j < size; j++){
            res[lu.int_to_string[i]][lu.int_to_string[j]] = lu.int_to_string[*(neighbour + i * size + j)];
        }
    }
    std::cout << "Map done" << std::endl;

    return res;

}

#endif

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