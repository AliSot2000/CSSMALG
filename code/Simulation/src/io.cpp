#include <string>
#include <iostream>
#include <map>

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

bool hasPrecompute(const json& map){
    return map.contains("world") && map.contains("carTree") && map.contains("bikeTree");
}

void importMap(world_t& world, json& map) {
	assert(world.streets.size() == 0 && "Streets is not empty");
    // Data will be packed more neatly when first creating array with given size
    world.crossings = std::vector<Crossing>(map["intersections"].size());

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
		street.id = data["id"];
		street.length = data["distance"];
		street.width = LANE_WIDTH * data["lanes"].size();
        street.speedlimit = static_cast<float>(data["speed_limit"]) / 3.6f;

		if (data["lanes"].empty()) {
			std::cerr << "Street has no lanes? Default type will be both car & bike allowed." << std::endl;
			street.type = StreetTypes::Both;
		}
		else {
            // TODO What happens if we have multiple lanes.
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

		street.start = data["intersections"]["start"]["id"];
		street.end = data["intersections"]["end"]["id"];

		world.crossings[intersectionIdToIndex[street.start]].outbound[street.end] = &street;
		world.crossings[intersectionIdToIndex[street.end]].inbound.push_back(&street);

		index++;
	}
}

void importAgents(world_t& world, json& agents, SPT carsSPT, SPT bikeSPT){
    assert(world.actors.size() == 0 && "Agents is not empty");
    world.actors = std::vector<Actor>(agents["bikes"].size() + agents["cars"].size());
    int index = 0;

    // Import Bikes
    for (const auto& [name, data] : agents["bikes"].items()) {
        Actor actor = {
                .type = ActorTypes::Bike,
                .distanceToCrossing = 0.0f,
                .distanceToRight = 0,
                .length = data["length"],

                .max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f, // Convert km/h to m/s
                .target_velocity = 50 / 3.6f,

                .acceleration = data["acceleration"],
                .deceleration = data["deceleration"],
                .acceleration_exp = data["acceleration_exponent"],

                .insertAfter = data["waiting_period"],

                //.width = 1.5f,
                .id = name,
        };

        std::string startIntersectionId = data["start_id"];
        std::string endIntersectionId = data["end_id"];

        actor.path = retrievePath(bikeSPT, startIntersectionId, endIntersectionId);

        for (auto& crossing : world.crossings) {
            if (crossing.id == startIntersectionId) {
                crossing.waitingToBeInserted.push_back(&actor);
                break;
            }
        }

        world.actors.at(index) = actor;
        index++;
    }

    for (const auto& [name, data] : agents["cars"].items()) {
        Actor actor = {
                .type = ActorTypes::Car,
                .distanceToCrossing = 0.0f,
                .distanceToRight = 0,
                .length = data["length"],

                .max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f, // Convert km/h to m/s
                .target_velocity = 50 / 3.6f,

                .acceleration = data["acceleration"],
                .deceleration = data["deceleration"],
                .acceleration_exp = data["acceleration_exponent"],

                .insertAfter = data["waiting_period"],

                //.width = 1.5f,
                .id = name,
        };

        std::string startIntersectionId = data["start_id"];
        std::string endIntersectionId = data["end_id"];

        actor.path = retrievePath(carsSPT, startIntersectionId, endIntersectionId);

        for (auto& crossing : world.crossings) {
            if (crossing.id == startIntersectionId) {
                crossing.waitingToBeInserted.push_back(&actor);
                break;
            }
        }

        world.actors.at(index) = actor;
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
		obj["type"] = actor.type == ActorTypes::Car ? "car" : "bike";
        obj["length"] = actor.length;
        obj["max_velocity"] = actor.max_velocity * 3.6f;
        obj["acceleration"] = actor.acceleration;
        obj["deceleration"] = actor.deceleration;
        obj["acceleration_exponent"] = actor.acceleration_exp;
        obj["waiting_period"] = actor.insertAfter;
        obj["start_crossing_id"] = actor.path.front();
        obj["end_crossing_id"] = actor.path.back();
	}

	return output;
}

void addFrame(world_t& world, json& out, const bool final) {
	json frame;
    json actorFrame;
    json crossingFrame;

    // Lambda function to create json object to add to output.
	auto a = [&actorFrame, &final](const Actor* actor, const Street* street, const float percent, bool active) {
        actorFrame[actor->id] = {};
		json& obj = actorFrame[actor->id];
		obj["road"] = street->id;
		obj["percent_to_end"] = percent; 
		obj["distance_to_side"] = actor->distanceToRight * 10.0f;
		obj["active"] = active;
        if (final){
            obj["start_time"] = actor->start_time;
            obj["end_time"] = actor->end_time;
        }

		if (!active) {
			// TODO remove when frames of not active cars can be discarded
			obj["distance_to_side"] = -10000.0f;
		}
	};

    auto c = [&crossingFrame](const Crossing* crossing) {
        crossingFrame[crossing->id] = {};
        json& obj = crossingFrame[crossing->id];
        obj["green"] = std::vector<json>();
        obj["red"] = std::vector<json>();
        int index = 0;
        for (const auto inboundRoad : crossing->inbound){
            if (index == crossing->green){
                obj["green"].push_back(inboundRoad->id);
            } else {
                obj["red"].push_back(inboundRoad->id);
            }
            index++;
        }
    };

    // Iterate through the actors on the street and update its distance.
	for (const auto& street : world.streets) {
		for (const auto& actor : street.traffic) {
			const float percent = 1.0f - (actor->distanceToCrossing / street.length);
			a(actor, &street, percent, true);
		}
	}

	for (auto& crossing : world.crossings) {
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

        // Output Green phase if it has changed.
        if (crossing.outputFlag) {
            c(&crossing);
            crossing.outputFlag = false;
        }
	}

    frame["agents"] = actorFrame;
    frame["intersections"] = crossingFrame;

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

void exportSPT(const SPT& carTree, const SPT& bikeTree, const json& input, json& output){
    output["carTree"] = carTree;
    output["bikeTree"] = bikeTree;
    output["world"] = input;
}

void importSPT(SPT& carTree, SPT& bikeTree, const json& input){
    // Creating empty SPT.
    carTree = SPT();
    bikeTree = SPT();

    // Importing Car Tree
    json cars = input["carTree"];
    for (const auto& [key, data] : cars.items()){
        carTree[key] = std::map<std::string, std::string>();
        for (const auto& [keyTwo, dataTwo] : cars[key].items()){
            carTree[key][keyTwo] = dataTwo;
        }
    }

    // Importing Bike Tree
    json bikes = input["bikeTree"];
    for (const auto& [key, data] : bikes.items()){
        bikeTree[key] = std::map<std::string, std::string>();
        for (const auto& [keyTwo, dataTwo] : bikes[key].items()){
            bikeTree[key][keyTwo] = dataTwo;
        }
    }
}