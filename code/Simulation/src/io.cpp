#include <string>
#include <iostream>
#include <map>

#include "update.hpp"
#include "io.hpp"
#include "actors.hpp"
#include "routing.hpp"
// #include <omp.h>
#include "base64.hpp"


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
    world.intersections = std::vector<Intersection>(map["intersections"].size());
    world.IntersectionPtr = std::vector<Intersection*>(map["intersections"].size());

	int32_t index = 0;
	for (const auto& [_, data] : map["intersections"].items()) {
        // Filling look up tables
		world.string_to_int[data["id"]] = index;
        world.int_to_string[index] = data["id"];

        Intersection& intersection = world.intersections[index];
		intersection.id = index;
        if (data.contains("trafficLight")){
            intersection.hasTrafficLight = data["trafficLight"];
        }

        world.IntersectionPtr[index] = &world.intersections[index];
		index++;
	}

	// Data will be packed more neatly when first creating array with given size
	world.streets = std::vector<Street>(map["roads"].size());
	world.StreetPtr = std::vector<Street*>(map["roads"].size());
	index = 0;
	for (const auto& [_, data] : map["roads"].items()) {
		Street& street = world.streets[index];
		street.id = data["id"];
		street.length = data["distance"];
		street.width = LANE_WIDTH * data["lanes"].size();
        street.speedlimit = static_cast<float>(data["speed_limit"]) / 3.6f;

		if (data["lanes"].empty()) {
			std::cerr << "Street has no lanes? Default type will be both car & bike allowed." << std::endl;
            std::cerr << "Failed Street ID: " << street.id << std::endl;
			street.type = StreetTypes::Both;
		}
		else {
            // TODO What happens if we have multiple lanes.
			json& lane = data["lanes"][0];
			if (lane["type"] == "both") {
				street.type = StreetTypes::Both;
			}
			else if (lane["type"] == "car") {
                street.type = StreetTypes::OnlyCar;
            }
            else if (lane["type"] == "bike") {
                street.type = StreetTypes::OnlyBike;
            } else {
                std::cerr << "Unknown street type: " << lane["type"] << std::endl;
            }
            for (int i = 1; i < data["lanes"].size(); ++i){
                assert(data["lanes"][i]["type"] == lane["type"] && "All lanes must have same type");
            }
		}

		street.start = world.string_to_int[data["intersections"]["start"]["id"]];
		street.end = world.string_to_int[data["intersections"]["end"]["id"]];

        if (street.type != StreetTypes::OnlyCar){
		    world.intersections[street.start].outboundBike[street.end] = &street;
        }
        if (street.type != StreetTypes::OnlyBike){
            world.intersections[street.start].outboundCar[street.end] = &street;
        }
		world.intersections[street.end].inbound.push_back(&street);

        world.StreetPtr[index] = &world.streets[index];
		index++;
    }

    world.empty = {
            .start = -1,
            .end = -1,
            .type = StreetTypes::Both,
            .width = 0,
            .length = 0,
            .speedlimit = 0,
            .id = "NO_ROUT",
    };
}

void importAgents(world_t& world, json& agents, spt_t& carsSPT, spt_t& bikeSPT){
    assert(world.actors.size() == 0 && "Agents is not empty");
    world.actors = std::vector<Actor*>(agents["bikes"].size() + agents["cars"].size());
    std::cout << "importing " << agents["bikes"].size() << " bikes and " << agents["cars"].size() << " cars" << std::endl;
    int index = 0;

    // Import Bikes
    for (const auto& [name, data] : agents["bikes"].items()) {
        Actor* actor = new Actor();

        // Set that shit
        actor->type = ActorTypes::Bike;
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = data["length"];

        actor->max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f; // Convert km/h to m/s
        actor->target_velocity = 50 / 3.6f;

        actor->acceleration = data["acceleration"];
        actor->deceleration = data["deceleration"];
        actor->acceleration_exp = data["acceleration_exponent"];

        actor->insertAfter = data["waiting_period"];

//        actor->width = 1.5f;
        actor->id = name;
//      Actor actor = {
//                .type = ActorTypes::Bike,
//                .distanceToIntersection = 0.0f,
//                .distanceToRight = 0,
//                .length = data["length"],
//
//                .max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f, // Convert km/h to m/s
//                .target_velocity = 50 / 3.6f,
//
//                .acceleration = data["acceleration"],
//                .deceleration = data["deceleration"],
//                .acceleration_exp = data["acceleration_exponent"],
//
//                .insertAfter = data["waiting_period"],
//
//                //.width = 1.5f,
//                .id = name,
//        };

        int startIntersectionId = world.string_to_int[data["start_id"]];
        int endIntersectionId = world.string_to_int[data["end_id"]];

        actor->path = retrievePath(bikeSPT, startIntersectionId, endIntersectionId, bikeSPT.size);

        for (auto& intersection : world.intersections) {
            if (intersection.id == startIntersectionId) {
                intersection.waitingToBeInserted.push_back(actor);
                break;
            }
        }

        world.actors.at(index) = actor;
        index++;
    }
    for (const auto& [name, data] : agents["cars"].items()) {
        Actor* actor = new Actor();

        // Set that shit
        actor->type = ActorTypes::Bike;
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = data["length"];

        actor->max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f; // Convert km/h to m/s
        actor->target_velocity = 50 / 3.6f;

        actor->acceleration = data["acceleration"];
        actor->deceleration = data["deceleration"];
        actor->acceleration_exp = data["acceleration_exponent"];

        actor->insertAfter = data["waiting_period"];

//        actor->width = 1.5f;
        actor->id = name;
//        Actor actor = {
//                .type = ActorTypes::Car,
//                .distanceToIntersection = 0.0f,
//                .distanceToRight = 0,
//                .length = data["length"],
//
//                .max_velocity = static_cast<float>(data["max_velocity"]) / 0.36f, // Convert km/h to m/s
//                .target_velocity = 50 / 3.6f,
//
//                .acceleration = data["acceleration"],
//                .deceleration = data["deceleration"],
//                .acceleration_exp = data["acceleration_exponent"],
//
//                .insertAfter = data["waiting_period"],
//
//                //.width = 1.5f,
//                .id = name,
//        };

        int startIntersectionId = world.string_to_int[data["start_id"]];
        int endIntersectionId = world.string_to_int[data["end_id"]];

        actor->path = retrievePath(carsSPT, startIntersectionId, endIntersectionId, carsSPT.size);

        for (auto& intersection : world.intersections) {
            if (intersection.id == startIntersectionId) {
                intersection.waitingToBeInserted.push_back(actor);
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
	output["peripherals"]["date"] = "Ich weiss doch ned wie mer date in c++ bechunt?"; // TODO Figure this out
	output["peripherals"]["type"] = "simulation";
	output["peripherals"]["elapsed_time"] = time;
	output["peripherals"]["time_step"] = timeDelta;

	output["simulation"] = std::vector<json>();
    int no_path = 0;

	for (const auto& actor : world.actors) {
		output["setup"]["agents"][actor->id] = {};
		json& obj = output["setup"]["agents"][actor->id];
		obj["id"] = actor->id;
		obj["type"] = actor->type == ActorTypes::Car ? "car" : "bike";
        obj["length"] = actor->length;
        obj["max_velocity"] = actor->max_velocity * 3.6f;
        obj["acceleration"] = actor->acceleration;
        obj["deceleration"] = actor->deceleration;
        obj["acceleration_exponent"] = actor->acceleration_exp;
        obj["waiting_period"] = actor->insertAfter;
        if (actor->path.empty()){
            obj["start_crossing_id"] = "NO_PATH_FOUND";
            obj["end_crossing_id"] = "NO_PATH_FOUND";
        } else {
            obj["start_crossing_id"] = world.int_to_string.at(actor->path.front());
            obj["end_crossing_id"] = world.int_to_string.at(actor->path.back());
        }
        no_path += actor->path.empty() ? 1 : 0;
	}
    std::cout << "No path found with  " << no_path << " agents." << std::endl << std::endl;
	return output;
}

void addFrame(world_t& world, json& out, const bool final) {
	json frame;
    json actorFrame;
    json intersectionFrame;

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
            obj["time_spent_waiting"] = actor->time_spent_waiting;
        }

		if (!active) {
			// TODO remove when frames of not active cars can be discarded
			obj["distance_to_side"] = -10000.0f;
		}
	};

    auto c = [&intersectionFrame](const Intersection* intersection) {
        intersectionFrame[intersection->id] = {};
        json& obj = intersectionFrame[intersection->id];
        obj["green"] = std::vector<json>();
        obj["red"] = std::vector<json>();
        int index = 0;
        for (const auto inboundRoad : intersection->inbound){
            if (index == intersection->green){
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
			const float percent = 1.0f - (actor->distanceToIntersection / street.length);
			a(actor, &street, percent, true);
		}
	}

	for (auto& intersection : world.intersections) {
        // Initial output so the simulation knows how many actors there are
		for (const auto& actor : intersection.waitingToBeInserted) {
            Street* street;
            if (actor->path.empty()){
                street = &world.empty;
            } else {
                int first = actor->path.front();
                if (actor->type == ActorTypes::Car){
                    street = intersection.outboundCar.find(first)->second;
                } else {
                    street = intersection.outboundBike.find(first)->second;
                }
            }
			if (!actor->outputFlag) {
				a(actor, street, 0.0f, false);
				actor->outputFlag = true;
			}
		}
        /*
        for (const auto& actor : intersection.waitingToBeInserted) {
			int first = actor->path.front();
            Street* street;
            if (actor->type == ActorTypes::Car){
                street = intersection.outboundCar.find(first)->second;
            } else {
                street = intersection.outboundBike.find(first)->second;
            }
			if (!actor->outputFlag) {
				a(actor, street, 0.0f, false);
				actor->outputFlag = true;
			}
		}
         */

        // Iterate through every actor which has newly arrived at his destination to print out his last frame.
		for (const auto& pair : intersection.arrivedFrom) {
			if (!pair.first->outputFlag) {
				a(pair.first, pair.second, 1.0f, false);
				pair.first->outputFlag = true;
			}
		}

        // Output Green phase if it has changed.
        if (intersection.outputFlag) {
            c(&intersection);
            intersection.outputFlag = false;
        }
	}

    frame["agents"] = actorFrame;
    frame["intersections"] = intersectionFrame;

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

void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input, json& output){
    void* carTreePtr =  carTree.array;
    unsigned char* carTreeChar = static_cast<unsigned char*>(carTreePtr);
    void* bikePtr =  bikeTree.array;
    unsigned char* bikeTreeChar = static_cast<unsigned char*>(bikePtr);

    output["carTree"] = base64_encode(carTreeChar,  carTree.size * carTree.size * sizeof(int) * sizeof(int));
    output["bikeTree"] = base64_encode(bikeTreeChar, bikeTree.size * bikeTree.size * sizeof(int) * sizeof(int));
    output["world"] = input;
}

void importSPT(spt_t& carTree, spt_t& bikeTree, const json& input, world_t& world){
    carTree = {
            .array = nullptr,
            .size = static_cast<int>(world.intersections.size()),
            };
    // Creating empty SPT.
    bikeTree = {
            .array = nullptr,
            .size = static_cast<int>(world.intersections.size()),
    };

    // Get the String
    std::string carTreeB64 = input["carTree"];
    std::string bikeTreeB64 = input["bikeTree"];

    // Convert to std::vector<unsigned char>
    std::vector<BYTE> carTreeBytes = base64_decode(carTreeB64);
    std::vector<BYTE> bikeTreeBytes = base64_decode(bikeTreeB64);

    // Allocate Memory for copying
    BYTE* carTreePtr = new BYTE[carTree.size * carTree.size * sizeof(int)];
    BYTE* bikeTreePtr = new BYTE[bikeTree.size * bikeTree.size * sizeof(int)];

    // Copy to allocated Memory
    std::copy(carTreeBytes.begin(), carTreeBytes.end(), carTreePtr);
    std::copy(bikeTreeBytes.begin(), bikeTreeBytes.end(), bikeTreePtr);

    void* carTreeVoidPtr = static_cast<void*>(carTreePtr);
    void* bikeTreeVoidPtr = static_cast<void*>(bikeTreePtr);

    carTree.array = static_cast<int*>(carTreeVoidPtr);
    bikeTree.array = static_cast<int*>(bikeTreeVoidPtr);

    for (int i = 0; i < carTree.size; i++){
        for (int j = 0; j < carTree.size; j++){
            std::cout << carTree.array[i * carTree.size + j] << " ";
        }
        std::cout << std::endl;
    }
}

bool binDumpSpt(spt_t Tree, const char* file_name) {
    void *carTreePtr = Tree.array;
    unsigned char *carTreeChar = static_cast<unsigned char *>(carTreePtr);
    std::string ostring = base64_encode(carTreeChar, Tree.size * Tree.size * sizeof(int));

    std::ofstream f(file_name);
    f << ostring;
    f.close();
    return true;

//    /*
//    FILE *file = fopen(fname, "wb");
//    fwrite(Tree.array, Tree.size * Tree.size * sizeof(int) * sizeof(int), 1, file);
//    fclose(file);
//     */
//
//    std::ofstream f(fname, std::ios::out | std::ios::binary);
//    if (!f){
//        std::cerr << "Failed to open " << fname << std::endl;
//        return false;
//    }
//    f.write(static_cast<char*>(carTreePtr), Tree.size * Tree.size);
//    std::cout << "Dumped SPT to " << Tree.size * Tree.size << std::endl;
//    f.close();
//    if (!f.good()){
//        std::cerr << "Failed to write to " << fname << std::endl;
//        return false;
//    }
//    return true;
}

void jsonDumpStats(const float& avgTime, json& output, world_t& world, const bool final){
    output["avgTime"] = avgTime;
    output["intersections"] = std::vector<json>();
    output["streets"] = std::vector<json>();

    // Get data from intersections
    for (auto& intersection : world.intersections) {
        json obj = {};
        obj["id"] = world.int_to_string.at(intersection.id);
        obj["bikeFlow"] = intersection.bike_flow_accumulate / avgTime;
        obj["carFlow"] = intersection.car_flow_accumulate / avgTime;
        intersection.car_flow_accumulate = 0.0f;
        intersection.bike_flow_accumulate = 0.0f;
        output["intersections"].push_back(obj);
    }

    // Get data from streets
    for (auto& street : world.streets) {
        json obj = {};
        obj["id"] = street.id;
        obj["flow"] = street.flow_accumulate / avgTime;
        obj["density"] = street.density_accumulate / avgTime;
        if (final) {
            obj["total_passing_traffic"] = street.total_traffic_count;
        }
        street.flow_accumulate = 0.0f;
        street.density_accumulate = 0.0f;
        output["streets"].push_back(obj);
    }
}


bool binLoadTree(spt_t& SPT, const char* file_name, const world_t& world) {
    std::ifstream f(file_name);
    if (!f.is_open()) {
        std::cerr << "Failed to load " << file_name << std::endl;
        return false;
    }

    std::stringstream b64stuff;
    b64stuff << f.rdbuf();

    std::vector<BYTE> inStream = base64_decode(b64stuff.str());
    std::cout << "Loaded SPT of size " << inStream.size() << std::endl;
    unsigned char* charPtr = inStream.data();

    // Pointer magic
    void* voidPtr = static_cast<void*>(charPtr);
    int* tempVectorPtr = static_cast<int*>(voidPtr);

    SPT.size = static_cast<int>(world.intersections.size());
    SPT.array = new int[SPT.size * SPT.size];

    // Copy data to non-temporary memory
    std::copy(tempVectorPtr, tempVectorPtr + SPT.size * SPT.size, SPT.array);
    f.close();
    return true;
}