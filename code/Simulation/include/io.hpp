#pragma once

#include <nlohmann/json.hpp>

#include "actors.hpp"
#include "routing.hpp"

using nlohmann::json;

/*
 * Loads a file and parses it as json.
 *
 * @param file, path to file
 * @param input json obj or sth to write the content into
 *
 * @returns True <=> the loading was successful.
*/
bool loadFile(const std::string& file, json& input);

/*
 * Imports a json file into the c++ data structure.
 *
 * @param world (world) of current simulation
 * @param map Address where the resulting map will be stored
 *
 * @returns void
 */
void importMap(world_t& world, nlohmann::json& map);

/*
 * Imports a json file into the C++ data structure.
 *
 * @param world (world) of current simulation
 * @param agents the agents loaded from the json file
 * @param carsSPT precalculated shortest path tree for cars
 * @param bikeSPT precalculated shortest path tree for bikes 
 *
 * @returns void
 * 
 * @TODO Agents count must be precomputed so that world.agents can be properly sized beforehand for data integrity.
 * 
 */
void importAgents(world_t& world, json& agents, SPT& carsSPT, SPT& bikeSPT);

/*
 * Docs in progress...
 *
 * @param world world to export
 * @param time elapsed time
 * @param timeDelta increment steps taken in simulation
 * @param originMap originally imported map, needed for simulation visualization
 *
 * @returns Export json data, which is usable by the simulation visualizer
 */
json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap);

/*
 * Inserts for each actor a frame containing its location into the output
 *
 * @param world, world to export
 * @param out output json
 * @returns void
 *
 */
void addFrame(const world_t& world, nlohmann::json& out);

/*
 * Saves the  output json to a given file path.
 *
 * @param file Path to save file
 * @param out JSON which will be written to file
 *
 * @returns void
 */
void save(const std::string& file, const nlohmann::json& out);