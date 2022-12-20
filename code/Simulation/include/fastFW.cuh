//
// Created by alisot2000 on 05.12.22.
//

#ifndef CSSMALG_FASTFW_H
#define CSSMALG_FASTFW_H

/**
Compute floyd Warshall algorithm on a graph

@param dis, pointer to a Array of size V*V, where V is the number of vertices in the graph, containing the distance between points.
@param next, pointer to a Array of size V*V, where V is the number of vertices in the graph, containing the next vertex in the shortest path.
@param V, number of vertices in the graph
*/
void FloydWarshal(double* dis, int* next, int V);

#endif //CSSMALG_FASTFW_H
