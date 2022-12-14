//
// Created by alisot2000 on 05.12.22.
//
#ifndef CSSMALG_FASTFW_CU
#define CSSMALG_FASTFW_CU

#include <iostream>
#include <assert.h>
#define CUDA_SCALAR 4

__global__
void GPUInnerLoops(double *dis, int *next, int k, int V) {
    //calculates unique thread ID in the block
    int t = (blockDim.x*blockDim.y)*threadIdx.z+(threadIdx.y*blockDim.x)+(threadIdx.x); // Absolute Thread ID using block dimensions

    //calculates unique block ID in the grid
    int b= (gridDim.x*gridDim.y)*blockIdx.z+(blockIdx.y*gridDim.x)+(blockIdx.x); // Absolute Block ID using grid dimensions

    //block size (this is redundant though)
    int T= blockDim.x*blockDim.y*blockDim.z;

    //grid size (this is redundant though)
    int B= gridDim.x*gridDim.y*gridDim.z;

    double newDistance;
    /*
    * Each cell in the matrix is assigned to a different thread.
    * Each thread do O(number of assigned cell) computation.
    * Assigned cells of different threads does not overlape with
    * each other. And so no need for synchronization.
    */
    for (int i=b; i<V; i+=B)
        {
            for(int j=t; j<V; j+=T)
            {
                newDistance=dis[i * V + k] + dis[k * V + j];
                next[i * V + j] = next[i * V + k] * (newDistance < dis[i * V + j]) + next[i * V + j] * (newDistance >= dis[i * V + j]);
                dis[i * V + j] = newDistance * (newDistance < dis[i * V + j]) + dis[i * V + j] * (newDistance >= dis[i * V + j]);
            }
        }
    }

void FloydWarshal(double* dis, int* next, int V){
    double* distance;
    int* neighbour;

    // Allocate Memory on GPU
    auto alresult = cudaMallocManaged(&distance, V*V*sizeof(double));
    assert(alresult == cudaSuccess && "Failed to allocate memory on GPU for distance");
    alresult = cudaMallocManaged(&neighbour, V*V*sizeof(int));
    assert(alresult == cudaSuccess && "Failed to allocate memory on GPU for neighbour");

    // Copy prepared Array to
    auto result = cudaMemcpy(distance, dis, V * V * sizeof(double), cudaMemcpyHostToDevice);
    assert(result == cudaSuccess && "Failed to copy distance array to GPU");

    result = cudaMemcpy(neighbour, next, V * V * sizeof(int), cudaMemcpyHostToDevice);
    assert(result == cudaSuccess && "Failed to copy neighbour array to GPU");

    std::cout << std::endl;
    for (int k = 0; k < V; k++)
    {
#ifdef SLURM_OUTPUT
        std::cout << "k: " << (k + 1) << " of " << V << std::cout;
#else
        std::cout << "\rk: " << (k + 1) << " of " << V << std::flush;
#endif

        GPUInnerLoops<<<dim3(CUDA_SCALAR,1,1),dim3(1024,1,1)>>>(distance,neighbour,k,V);
        alresult = cudaGetLastError();
        assert(alresult == cudaSuccess && "Failed to launch GPUInnerLoops kernel");
        result = cudaDeviceSynchronize();
        assert(result == cudaSuccess && "Failed to synchronize GPU");
        /*
        for (int i = 0; i < V; i++){
            for (int j = 0; j < V; j++){
                std::cout << distance[i * V + j] << " ";
            }
            std::cout << std::endl;
        }
         */
    }
    std::cout << std::endl;

    result = cudaMemcpy(dis, distance, V * V * sizeof(double), cudaMemcpyDeviceToHost);
    assert(result == cudaSuccess && "Failed to copy distance array to CPU");
    result = cudaMemcpy(next, neighbour, V * V * sizeof(int), cudaMemcpyDeviceToHost);
    assert(result == cudaSuccess && "Failed to copy neighbour array to CPU");
}

#endif


