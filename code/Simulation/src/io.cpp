
#include <string>
#include <iostream>
#include <fstream>

#include "update.hpp"
#include "io.hpp"
#include "actors.hpp"
#include "routing.hpp"


bool loadFile(const std::string& file, json& input) {
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
    world.crossings = std::vector<Crossing>(map["intersections"].size());

	// Save intersections and create a mapping from intersection id to its world.crossing index
	int32_t index = 0;
	std::map<std::string, int32_t> intersectionIdToIndex;
	for (const auto& [_, data] : map["intersections"].items()) {
		intersectionIdToIndex[data["id"]] = index;
		Crossing& crossing = world.crossings[index];
		crossing.id = data["id"];
		index++;
	}

	// Data will be packed more neatly when first creating array with given size
	world.streets = std::vector<Street>(map["roads"].size());
	
	index = 0;
	for (const auto& [_, data] : map["roads"].items()) {
		Street& street = world.streets[index];

		// Extract data
		street.id = data["id"];
		street.length = data["distance"];
		street.width = LANE_WIDTH * data["lanes"].size();
        street.speedlimit = static_cast<float>(data["speed_limit"]) / 3.6f;

		// Find out what kind of lanes the street contains
		if (data["lanes"].empty()) {
			std::cerr << "Street has no lanes? Default type will be both car & bike allowed." << std::endl;
			street.type = StreetTypes::Both;
		}
		else {
			json& lane = data["lanes"][0];
			if (lane["type"] == "both") {
				street.type = StreetTypes::Both;
			}
			else if (lane["type"] == "bike") {
				street.type = StreetTypes::OnlyBike;
			} else {
                street.type = StreetTypes::OnlyCar;
            }
		}

		// Important for path lookup later
		street.start = data["intersections"]["start"]["id"];
		street.end = data["intersections"]["end"]["id"];
		world.crossings[intersectionIdToIndex[street.start]].outbound[street.end] = &street;
		world.crossings[intersectionIdToIndex[street.end]].inbound.push_back(&street);

		index++;
	}
}

void importAgents(world_t& world, json& agents, SPT& carsSPT, SPT& bikeSPT) {
    assert(world.actors.size() == 0 && "Agents is not empty");

	auto createActor = [&](std::string name, json& data, ActorTypes type) {
		Actor actor = {
				.type = type,
				.distanceToCrossing = 0.0f,
				.distanceToRight = 0,
				.length = data["length"],

				.max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f, // Convert km/h to m/s
				.target_velocity = 50 / 3.6f,

				.acceleration = data["acceleration"],
				.deceleration = data["deceleration"],
				.acceleration_exp = data["acceleration_exponent"],

				.insertAfter = data["waiting_period"],

				.id = name,
		};

		// Path planning 
		std::string startIntersectionId = data["start_id"];
		std::string endIntersectionId = data["end_id"];
		actor.path = retrievePath(bikeSPT, startIntersectionId, endIntersectionId);

		for (auto& crossing : world.crossings) {
			if (crossing.id == startIntersectionId) {
				crossing.waitingToBeInserted.push_back(&actor);
				break;
			}
		}

		world.actors.push_back(actor);
	};

    // Import Bikes
    for (const auto& [name, data] : agents["bikes"].items()) {
		createActor(name, data, ActorTypes::Bike);
    }

	// Import Cars
	for (const auto& [name, data] : agents["cars"].items()) {
		createActor(name, data, ActorTypes::Car);
	}
}

json exportWorld(const world_t& world, const float& time, const float& timeDelta, const json& originMap) {
	json output;

	// Meta Data
	output["setup"]["map"] = originMap;
	output["peripherals"] = {};
	output["peripherals"]["date"] = "Ich weiss doch ned wie mer date in c++ bechunt?";
	output["peripherals"]["type"] = "simulation";
	output["peripherals"]["elapsed_time"] = time;
	output["peripherals"]["time_step"] = timeDelta;

	// Placeholder for frames
	output["simulation"] = std::vector<json>();

	// Actor meta data
	for (const auto& actor : world.actors) {
		output["setup"]["agents"][actor.id] = {};
		json& obj = output["setup"]["agents"][actor.id];
		obj["id"] = actor.id;
		obj["type"] = actor.type == ActorTypes::Car ? "car" : "bike";
	}

	return output;
}

void addFrame(const world_t& world, json& out) {
	json frame;

    // Lambda function to create json object to add to output.
	auto a = [&frame](const Actor* actor, const Street* street, const float percent, bool active) {
		frame[actor->id] = {};
		json& obj = frame[actor->id];
		obj["road"] = street->id;
		obj["percent_to_end"] = percent; 
		obj["distance_to_side"] = actor->distanceToRight * 10.0f;
		obj["active"] = active;

		if (!active) {
			// TODO remove when frames of not active cars can be discarded
			obj["distance_to_side"] = -10000.0f;
		}
	};

    // Iterate through the actors on the street and update its distance.
	for (const auto& street : world.streets) {
		for (const auto& actor : street.traffic) {
			const float percent = 1.0f - (actor->distanceToCrossing / street.length);
			a(actor, &street, percent, true);
		}
	}

	for (const auto& crossing : world.crossings) {
		for (const auto& actor : crossing.waitingToBeInserted) {
			std::string first = actor->path.front();
			Street* street = crossing.outbound.find(first)->second;
			if (!actor->outputFlag) {
				a(actor, street, 0.0f, false);
				actor->outputFlag = true;
			}
		}

		for (const auto& pair : crossing.arrivedFrom) {
			if (!pair.first->outputFlag) {
				a(pair.first, pair.second, 1.0f, false);
				pair.first->outputFlag = true;
			}
		}
	}

	if (frame.size() > 0) {
		out["simulation"].push_back(frame);
	}
}

void save(const std::string& file, const json& out) {
	std::ofstream f(file);

	if (f.is_open()) {
		f << std::setw(4) << out << std::endl;
		f.close();
	}
	else {
		std::cerr << "Failed to save to " << file << std::endl;
	}
}
