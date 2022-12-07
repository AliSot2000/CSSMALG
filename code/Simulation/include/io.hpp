#pragma once

#include <fstream>

#include <rapidjson/document.h>
#include <rapidjson/istreamwrapper.h>
#include <rapidjson/writer.h>
#include <rapidjson/ostreamwrapper.h>

#include "actors.hpp"
#include "routing.hpp"

using namespace rapidjson;

/*
 * Loads a file with json format into a json buffer
 *
 * @param file: path to file
 * @param input: json obj or sth to write the content into
 *
 * @returns True <=> the loading was successful.
*/
bool loadFile(const std::string& file, Document& input);

/*
 * Small wrapper to determine if the map contains a precomputed SPT.
 *
 * @param map: json object provided via file.
 *
 * @returns bool, weather the map contains precomputed SPTs.
 */
bool hasPrecompute(const Document& map);

/*
 * Imports a json object into the c++ data structure.
 *
 * @param world: (world) of current simulation
 * @param map: the map loaded from the json file
 *
 * @returns void
 */
void importMap(world_t& world, Document& map);

/*
 * Imports a json object into the c++ data structure.
 *
 * @param world: (world) of current simulation
 * @param agents: the agents loaded from the json file
 *
 * @returns void
 */
void importAgents(world_t& world, Document& agents, spt_t& carsSPT, spt_t& bikeSPT);

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
Document exportWorld(world_t& world, const float& time, const float& timeDelta, Value& originMap);

/*
 * Adds a frame to the output json.
 *
 * @param world: world to export
 * @param out: output json
 *
 * @returns void
 *
 */
void addFrame(world_t& world, Document& out, const bool final = false);

/*
 * Exports the c++ data structure into a json object.
 *
 * @param world: (world) of current simulation
 * @param map: the map loaded from the json file
 * @param final: if set, adds the start and end time of the travel of actors.
 *
 * @returns void
 */
bool save(const std::string& file, const Document& out);

bool dumpSpt(spt_t Tree, const char* fname);