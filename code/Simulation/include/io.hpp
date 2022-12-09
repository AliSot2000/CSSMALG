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
 *
 * @returns void
 */
void importMap(world_t* world, nlohmann::json* map);

/*
 * Imports a json object into the c++ data structure.
 *
 * @param world: (world) of current simulation
 * @param agents: the agents loaded from the json file
 *
 * @returns void
 */
void importAgents(world_t& world, json& agents, spt_t& carsSPT, spt_t& bikeSPT);

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
json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap);

/*
 * Adds a frame to the output json.
 *
 * @param world: world to export
 * @param out: output json
 *
 * @returns void
 *
 */
void addFrame(world_t& world, nlohmann::json& out, const bool final = false);

/*
 * Exports the c++ data structure into a json object.
 *
 * @param world: (world) of current simulation
 * @param map: the map loaded from the json file
 * @param final: if set, adds the start and end time of the travel of actors.
 *
 * @returns void
 */
void save(const std::string& file, const nlohmann::json& out);

/*
 * Exports the Shortest Path Tree as well as the current world of the simulation to one json file.
 * The purpose of this function is to save time when loading the map again by not having to compute floyd warshall again.
 *
 * @param carTree: Shortest Path Tree for cars
 * @param bikeTree: Shortest Path Tree for bikes
 * @param input_world: (world) of current simulation
 * @param output: json obj or sth to write the content into
 *
 * @returns void
*/
void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input, json& output);

/*
 * Imports the Shortest Path Trees from a json object.
 *
 * @param carTree: Shortest Path Tree for cars
 * @param bikeTree: Shortest Path Tree for bikes
 * @param input: json obj read the content from
 *
 * @returns void
 * */
void importSPT(spt_t& carTree, spt_t& bikeTree, const json& input, world_t& world);

bool binDumpSpt(spt_t Tree, const char* file_name);

void jsonDumpStats(const float& avgTime, json& output, world_t& world, const bool final);

bool binLoadTree(spt_t& SPT, const char* file_name, const world_t& world);

void exportAgents(json& out, const world_t& world);