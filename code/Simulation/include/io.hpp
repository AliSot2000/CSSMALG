#pragma once

#include <fstream>
#include <nlohmann/json.hpp>

#include "actors.hpp"

using nlohmann::json;

bool loadFile(std::string file, json& input);
void importMap(world_t& world, nlohmann::json& map);
json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap);
void addFrame(const world_t& world, nlohmann::json& out);
void save(const std::string file, const nlohmann::json& out);