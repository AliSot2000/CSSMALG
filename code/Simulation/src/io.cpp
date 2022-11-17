
#include <iostream>

#include "update.hpp"
#include "io.hpp"


bool loadFile(std::string file, json& input) {
	std::ifstream f(file);
	if (f.is_open()) {
		f >> input;
		f.close();
		return true;
	}
	std::cerr << "Failed to load " << file << std::endl;
	return false;
}

void importMap(world_t& world, json& map) {

	assert(world.streets.size() == 0 && "Streets is not empty");

	// Data will be packed more neatly when first creating array with given size
	world.streets = std::vector<Street>(map["roads"].size());
	
	int32_t index = 0;
	for (const auto& [id, data] : map["roads"].items()) {
		Street& street = world.streets[index];
		street.id = id;
		street.length = data["distance"];
		street.width = LANE_WIDTH * data["lanes"].size();

		// TODO fix
		// street.type = data["type"];
		street.type = StreetTypes::Both;

		index++;
	}
}

json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap) {
	json output;

	output["setup"]["map"] = originMap;

	output["peripherals"] = {};
	output["peripherals"]["date"] = "Ich weiss doch ned wie mer date in c++ bechunt?";
	output["peripherals"]["type"] = "simulation";
	output["peripherals"]["elapsed_time"] = time;
	output["peripherals"]["time_step"] = timeDelta;

	output["simulation"] = std::vector<json>();

	for (const auto& actor : world.actors) {
		output["setup"]["agents"][actor.id] = {};
		json& obj = output["setup"]["agents"][actor.id];
		obj["id"] = actor.id;
		obj["type"] = "car";
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
	else {
		std::cerr << "Failed to save to " << file << std::endl;
	}
}
