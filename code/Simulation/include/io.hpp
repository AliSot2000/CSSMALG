#pragma once

#include <fstream>
#include <nlohmann/json.hpp>

#include "actors.hpp"
#include "routing.hpp"

using nlohmann::json;

/*
 * Loads a file with json format into a json buffer
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
 * @param map the map loaded from the json file
 *
 * @returns void
 */
void importMap(world_t& world, nlohmann::json& map);

/*
 * Imports a json file into the c++ data structure.
 *
 * @param world (world) of current simulation
 * @param agents the agents loaded from the json file
 *
 * @returns void
 */
void importAgents(world_t& world, json& agents, SPT carsSPT, SPT bikeSPT);

/*
 * Docs in progress...
 *
 * @param world world to export
 * @param time elapsed time
 * @param timeDelta increment steps takein in simulation
 * @param originMap originally imported map
 *
 * @returns json marshalling.
 */
json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap);

/*
 * Adds a frame to the output json.
 *
 * @param world, world to export
 * @param out output json
 * @returns void
 *
 */
void addFrame(world_t& world, nlohmann::json& out);

/*
 * Imports a json file into the c++ data structure.
 *
 * @param world (world) of current simulation
 * @param map the map loaded from the json file
 *
 * @returns void
 */

void save(const std::string& file, const nlohmann::json& out);

void exportSPT(const SPT& carTree, const SPT& bikeTree, json& output);