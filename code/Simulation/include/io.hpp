#pragma once

#include <fstream>
#include <nlohmann/json.hpp>

#include "actors.hpp"
#include "routing.hpp"

using nlohmann::json;

/*
 * Loads a file with json format into a json buffer
 *
 * @param file: path to file
 * @param input: json obj or sth to write the content into
 *
 * @returns True <=> the loading was successful.
*/
bool loadFile(const std::string file, json* input);

/*
 * Small wrapper to determine if the map contains a precomputed SPT.
 *
 * @param map: json object provided via file.
 *
 * @returns bool, weather the map contains precomputed SPTs.
 */
bool hasPrecompute(const json* map);

/*
 * Imports a json object into the c++ data structure.
 *
 * @param world: (world) of current simulation
 * @param map: the map loaded from the json file
 * @param doTrafficLights Flag if traffic lights should be simulated
 *
 * @returns void
 */
void importMap(world_t* world, nlohmann::json* map, bool doTrafficLights = true);

/*
 * Imports a json object into the c++ data structure.
 *
 * @param world: (world) of current simulation
 * @param agents: the agents loaded from the json file
 * @param carsSPT shortest path tree for cars
 * @param bikeSPT shortest path tree for bikes
 *
 * @returns void
 */
void importAgents(world_t* world, json* agents, spt_t* carsSPT, spt_t* bikeSPT);

/*
 * Exports the world to json format. It is the static part of the simulation. The simulation is added step by step with
 * addFrame.
 *
 * @param world: world to export
 * @param time: elapsed time
 * @param timeDelta: increment steps takeing in simulation
 * @param originMap: originally imported map
 *
 * @returns json marshalling.
 */
json exportWorld(const world_t* world, const float& time, const float& timeDelta, const json* originMap);

/*
 * Adds a frame to the output json.
 *
 * @param world: world to export
 * @param out: output json
 * @param final: if set, adds the start and end time of the travel of actors.
 *
 * @returns void
 *
 */
void addFrame(world_t* world, nlohmann::json* out, const bool final = false);

/*
 * Exports the c++ data structure into a json object.
 *
 * @param world: (world) of current simulation
 * @param map: the map loaded from the json file
 *
 * @returns void
 */
void save(const std::string file, const nlohmann::json* out);

/*
 * Exports the Shortest Path Tree as well as the current world of the simulation to one json file.
 * The purpose of this function is to save time when loading the map again by not having to compute floyd warshall again.
 *
 * @param carTree: Shortest Path Tree for cars
 * @param bikeTree: Shortest Path Tree for bikes
 * @param input_world: (world) of current simulation
 * @param output: json obj or sth to write the content into
 * @param dir Output directory
 *
 * @returns void
*/
#ifdef SINGLE_FILE_EXPORT
void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input, const world_t* world, const std::string dir);
#else
void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input, json& output, const world_t* world);
#endif
/*
 * Imports the Shortest Path Trees from a json object.
 *
 * @param carTree: Shortest Path Tree for cars
 * @param bikeTree: Shortest Path Tree for bikes
 * @param input: json obj read the content from
 * @param world World to import for
 *
 * @returns void
 * */
void importSPT(spt_t* carTree, spt_t* bikeTree, const json* input, world_t* world);

/**

Dumps the contents of a spt_t struct to a binary file.
@param Tree A pointer to the spt_t struct to be dumped.
@param file_name The name of the output file.
@return True if the operation was successful, false otherwise.
*/
bool binDumpSpt(spt_t* Tree, const char* file_name);

/**
Dumps statistics to a json object.
@param avgTime The average time of the simulation.
@param output A pointer to the json object where the statistics will be stored.
@param world A pointer to the world object.
@param final A flag indicating whether this is the final statistics dump.
*/
void jsonDumpStats(const float& avgTime, json* output, world_t* world, const bool final);

/**

Loads a spt_t struct from a binary file.
@param SPT A pointer to the spt_t struct to be loaded.
@param file_name The name of the input file.
@param world A pointer to the world object.
@return True if the operation was successful, false otherwise.
*/
bool binLoadTree(spt_t* SPT, const char* file_name, const world_t* world);

/**

Exports the agents (actors) in a world to a json object.
@param out A pointer to the json object where the agents will be stored.
@param world A pointer to the world object.
*/
void exportAgents(json* out, const world_t* world);

/**

Prints the contents of a spt_t struct to the console.
@param SPT A pointer to the spt_t struct to be printed.
*/
void printSPT(const spt_t* SPT);

/*
	Returns the number of digits of @param i
*/
unsigned int GetNumberOfDigits (unsigned int i);

/**

Connects the opposite streets in a world.
@param world A pointer to the world object.
@param lookupVector A map containing the street ID's and pointers to the street objects.
*/
void connectOpposite(world_t* world, const std::map<std::string, street_t*> lookupVector);