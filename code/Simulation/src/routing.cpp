#include "routing.hpp"

#include <iostream>
#include <algorithm>

#include "fastFW.cuh"
#include "routing.hpp"
#include <cassert>


// Idea: If a road has multiple turning lanes, split a intersection into sets of identical turn options and split the single
// Intersection vertex into multiple vertecies representing the intersection with each new vertex only containing roads with
// identical turning sets.

// Compute Floyd-Warshal on entire graph to find the shortest path from a to b.
#ifndef USE_CUDA
spt_t calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include) {
    spt_t sopatree = {
            .array = new int[world->intersections.size() * world->intersections.size()],
            .size = static_cast<int>(world->intersections.size()),
    };
	float* minimumDistance = new float[sopatree.size * sopatree.size];

    // Initialize the distance and neighbour arrays
    for (int start = 0; start < sopatree.size; start++){
        for (int end = 0; end < sopatree.size; end++) {
            *(minimumDistance + start * sopatree.size + end) = (start != end) * 1e30; // Initializing the default distance between nodes
            *(sopatree.array + start * sopatree.size + end) = (start == end) * start + (start != end) * -1; // Initializing the default neighbour
        }
    }

	for (const auto& street : world->streets) {
		if (std::find(include.begin(), include.end(), street.type) != include.end()) {
            // Access the matrix as a 1D array.
			*(minimumDistance + street.start * sopatree.size + street.end) = std::min(static_cast<float>(street.length),
                                                                                      *(minimumDistance + street.start * sopatree.size + street.end));
			*(sopatree.array + street.start * sopatree.size + street.end) = street.end;
		}
	}

    std::cout << std::endl;
    int V = sopatree.size;
    float newDistance;
	for (int32_t k = 0; k < sopatree.size; k++) {
        std::cout << "\rComputing " << k + 1<< " of " << sopatree.size << std::flush;

        for (int32_t i = 0; i < sopatree.size; i++) {

            for (int32_t j = 0; j < sopatree.size; j++) {
                newDistance = minimumDistance[i * sopatree.size + k] + minimumDistance[k * sopatree.size + j];
                sopatree.array[i * V + j] = sopatree.array[i * V + k] * (newDistance < minimumDistance[i * V + j]) + sopatree.array[i * V + j] * (newDistance >= minimumDistance[i * V + j]);
                minimumDistance[i * V + j] = newDistance * (newDistance < minimumDistance[i * V + j]) + minimumDistance[i * V + j] * (newDistance >= minimumDistance[i * V + j]);

			}
		}
        /*
        for (int i = 0; i < sopatree.size; i++){
            for (int j = 0; j < sopatree.size; j++){
                std::cout << sopatree.array[i * sopatree.size + j] << " ";
            }
            std::cout << std::endl;
        }
        std::cout << std::endl;*/
	}
    /*
    for (int i = 0; i < sopatree.size; i++){
        for (int j = 0; j < sopatree.size; j++){
            std::cout << sopatree.array[i * sopatree.size + j] << " ";
        }
        std::cout << std::endl;
    }
    std::cout << std::endl;
    */
	return sopatree;
}
#else

spt_t calculateShortestPathTree(const world_t* world, const std::vector<StreetTypes>& include){
    // Allocating Memory for the distance and optimal neighbour
    spt_t sopatree = {
            .array = new int[world->intersections.size() * world->intersections.size()],
            .size = static_cast<int>(world->intersections.size()),
    };

    int size = sopatree.size;
    double *distance = (double*)malloc(size * size * sizeof(double));
    int *neighbour = sopatree.array;

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
            int start = street.start;
            int end = street.end;
            // Take the shortest street in case there are multiple (for what ever reason there should be multiple
            *(distance + start * size + end) = std::min(static_cast<double>(street.length), *(distance + start * size + end));
            *(neighbour + start * size + end) = end;
        }
    }

    for (int i = 0; i < size; i++){
        for (int j = 0; j < size; j++){
            std::cout << distance[i * size + j] << " ";
        }
        std::cout << std::endl;
    }

    for (int i = 0; i < sopatree.size; i++){
        for (int j = 0; j < sopatree.size; j++){
            std::cout << sopatree.array[i * sopatree.size + j] << " ";
        }
        std::cout << std::endl;
    }

    FloydWarshal(distance, neighbour, size);
    std::cout << std::endl;

    for (int i = 0; i < sopatree.size; i++){
        for (int j = 0; j < sopatree.size; j++){
            std::cout << sopatree.array[i * sopatree.size + j] << " ";
        }
        std::cout << std::endl;
    }


    for (int i = 0; i < size; i++){
        for (int j = 0; j < size; j++){
            std::cout << distance[i * size + j] << " ";
        }
        std::cout << std::endl;
    }
    return sopatree;
}

#endif

Path retrievePath(spt_t* spt, const int &start, const int &end) {
	if (spt->array[start * spt->size + end] == -1) {
		return {};
	}

	Path p;

	int u = start;
//    p.push(u);
	while (u != end) {
        assert(u < spt->size);
		u = spt->array[u * spt->size + end];
		p.push(u);
	}
	return p;
}
