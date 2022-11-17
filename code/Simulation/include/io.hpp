#pragma once

#include <fstream>
#include <nlohmann/json.hpp>

#include "actors.hpp"

nlohmann::json exportWorld(const world_t& world);
void addFrame(const world_t& world, nlohmann::json& out);
void save(const std::string file, const nlohmann::json& out);