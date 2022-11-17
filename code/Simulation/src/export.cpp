
#include "update.hpp"

#include "export.hpp"

using nlohmann::json;

json exportWorld(const world_t& world) {
	json output;

	output["setup"]["map"] = {};
	output["setup"]["map"]["roads"] = {};
	output["setup"]["map"]["intersections"] = {};
	output["setup"]["map"]["peripherals"] = {};
	output["setup"]["map"]["agents"] = {};

	output["setup"]["agents"] = {};
	output["peripherals"] = {};

	output["setup"]["map"]["peripherals"]["date"] = "2022-11-03_20-26-32";
	output["setup"]["map"]["peripherals"]["type"] = "save";
	output["peripherals"]["date"] = "2022-11-03_20-26-32";
	output["peripherals"]["type"] = "simulation";

	output["simulation"] = std::vector<json>();

	for (const auto& street : world.streets) {
		output["setup"]["map"]["roads"][street.id] = {};
		json& obj = output["setup"]["map"]["roads"][street.id];
		obj["id"] = street.id;
		obj["start"] = {};
		obj["start"]["x"] = street.sx;
		obj["start"]["y"] = street.sy;
		obj["end"]["x"] = street.ex;
		obj["end"]["y"] = street.ey;

		std::vector<json> lanes;
		for (int i = street.width; i > 0; i -= LANE_WIDTH) {
			json lane;
			lane["type"] = "car";
			lane["direction"] = 1;
			lane["left"] = false;
			lane["forward"] = true;
			lane["right"] = false;
			lanes.push_back(lane);
		}

		obj["lanes"] = lanes;
		obj["intersections"] = std::vector<json>();
		obj["distance"] = street.length;
	}

	for (const auto& actor : world.actors) {
		output["setup"]["agents"][actor.id] = {};
		json& obj = output["setup"]["agents"][actor.id];
		obj["id"] = actor.id;
		obj["type"] = "car";
		// obj["speed"] = actor.speed;
		// obj["lane"] = actor.distanceToRight;
		// obj["percent_to_end"] = 0.0f;
		// obj["road"] = 
	}
	return output;
}

void addFrame(const world_t& world, json& out) {
	json frame;

	for (const auto& street : world.streets) {
		for (const auto& actor : street.traffic) {
			frame[actor->id] = {};
			json& obj = frame[actor->id];
			obj["road"] = street.id;
			obj["percent_to_end"] = 1.0f - (1.0f / street.length * actor->distanceToCrossing);
			obj["distance_to_side"] = actor->distanceToRight * 10.0f;
		}
	}

	out["simulation"].push_back(frame);
}

void save(const std::string file, const json& out) {
	std::ofstream f(file);

	if (f.is_open()) {
		f << std::setw(4) << out << std::endl;
		f.close();
	}
}
