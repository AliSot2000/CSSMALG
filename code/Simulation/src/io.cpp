#include <string>
#include <iostream>
#include <map>
#include <stdlib.h>
#include <stdio.h>
#include <ctime>

#include "update.hpp"
#include "io.hpp"
#include "actors.hpp"
#include "routing.hpp"
// #include <omp.h>
#include "base64.hpp"


bool loadFile(const std::string& file, Document& input) {
	std::ifstream ifs(file);
	if (ifs.is_open()) {
        IStreamWrapper isw { ifs };
        input.ParseStream(isw);
        ifs.close();
        return true;
	}
	std::cerr << "Failed to load " << file << std::endl;
	return false;
}

bool hasPrecompute(const Document& map){
    return map.HasMember("world") && map.HasMember("carTree") && map.HasMember("bikeTree");
}

void importMap(world_t& world, Document& map) {
	assert(world.streets.size() == 0 && "Streets is not empty");
    // Data will be packed more neatly when first creating array with given size
    world.intersections = std::vector<Intersection>(map["intersections"].Size());

	int32_t index = 0;
	for (const auto& data : map["intersections"].GetArray()) {
        // Filling look up tables
		world.string_to_int[data["id"].GetString()] = index;
        world.int_to_string[index] = data["id"].GetInt();

        Intersection& intersection = world.intersections[index];
		intersection.id = index;
        if (data.HasMember("trafficLight")){
            intersection.hasTrafficLight = data["trafficLight"].GetBool();
        }

		index++;
	}

	// Data will be packed more neatly when first creating array with given size
	world.streets = std::vector<Street>(map["roads"].Size());
	
	index = 0;
	for (const auto& data : map["intersections"].GetArray()) {
		Street& street = world.streets[index];
		street.id = data["id"].GetString();
		street.length = data["distance"].GetFloat();
		street.width = LANE_WIDTH * data["lanes"].Size();
        street.speedlimit = data["speed_limit"].GetFloat() / 3.6f;

		if (data["lanes"].Empty()) {
			std::cerr << "Street has no lanes? Default type will be both car & bike allowed." << std::endl;
			street.type = StreetTypes::Both;
		}
		else {
			const Value& lane = data["lanes"][0];
			if (lane["type"] == "both") { // TODO This might need to be replaced with .GetString()
				street.type = StreetTypes::Both;
			}
			else if (lane["type"] == "bike") {
				street.type = StreetTypes::OnlyBike;
			} else {
                street.type = StreetTypes::OnlyCar;
            }
		}

		street.start = world.string_to_int[data["intersections"]["start"]["id"].GetString()];
		street.end = world.string_to_int[data["intersections"]["end"]["id"].GetString()];

		world.intersections[street.start].outbound[street.end] = &street;
		world.intersections[street.end].inbound.push_back(&street);

		index++;
	}
}

void importAgents(world_t& world, Document& agents, spt_t& carsSPT, spt_t& bikeSPT){
    assert(world.actors.size() == 0 && "Agents is not empty");
    world.actors = std::vector<Actor>(agents["bikes"].Size() + agents["cars"].Size());
    int index = 0;

    // Import Bikes
    for (auto i = agents["bikes"].MemberBegin(); i != agents["bikes"].MemberEnd(); ++i)
    {
        Value& data = i->value;
        Actor actor = {
                .type = ActorTypes::Bike,
                .distanceToIntersection = 0.0f,
                .distanceToRight = 0,
                .length = data["length"].GetFloat(),

                .max_velocity = data["max_velocity"].GetFloat() / 0.36f, // Convert km/h to m/s
                .target_velocity = 50 / 3.6f,

                .acceleration = data["acceleration"].GetFloat(),
                .deceleration = data["deceleration"].GetFloat(),
                .acceleration_exp = data["acceleration_exponent"].GetFloat(),

                .insertAfter = data["waiting_period"].GetFloat(),

                //.width = 1.5f,
                .id = i->name.GetString()
        };

        int startIntersectionId = world.string_to_int[data["start_id"].GetString()];
        int endIntersectionId = world.string_to_int[data["end_id"].GetString()];

        actor.path = retrievePath(bikeSPT, startIntersectionId, endIntersectionId);

        for (auto& intersection : world.intersections) {
            if (intersection.id == startIntersectionId) {
                intersection.waitingToBeInserted.push_back(&actor);
                break;
            }
        }

        world.actors.at(index) = actor;
        index++;
    }


    for (auto i = agents["cars"].MemberBegin(); i != agents["cars"].MemberEnd(); ++i) {
        Value& data = i->value;
        Actor actor = {
                .type = ActorTypes::Car,
                .distanceToIntersection = 0.0f,
                .distanceToRight = 0,
                .length = data["length"].GetFloat(),

                .max_velocity = data["max_velocity"].GetFloat() / 0.36f, // Convert km/h to m/s
                .target_velocity = 50 / 3.6f,

                .acceleration = data["acceleration"].GetFloat(),
                .deceleration = data["deceleration"].GetFloat(),
                .acceleration_exp = data["acceleration_exponent"].GetFloat(),

                .insertAfter = data["waiting_period"].GetFloat(),

                //.width = 1.5f,
                .id = i->name.GetString()
        };

        int startIntersectionId = world.string_to_int[data["start_id"].GetString()];
        int endIntersectionId = world.string_to_int[data["end_id"].GetString()];

        actor.path = retrievePath(carsSPT, startIntersectionId, endIntersectionId);

        for (auto& intersection : world.intersections) {
            if (intersection.id == startIntersectionId) {
                intersection.waitingToBeInserted.push_back(&actor);
                break;
            }
        }

        world.actors.at(index) = actor;
        index++;
    }
}

Document exportWorld(world_t& world, const float& elapsed_time, const float& timeDelta, Value& originMap) {
	Document output(kObjectType);

    Value setup(kObjectType);
    setup.AddMember("map", originMap, output.GetAllocator());

    Value peripherals(kObjectType);

    time_t rawtime;
    struct tm *timeinfo;
    char buffer [80];
    time( &rawtime );
    timeinfo = localtime(&rawtime);
    int len = static_cast<int>(strftime(buffer, sizeof(buffer), "%d-%m-%Y_%H-%M-%S", timeinfo));

    Value date;
    date.SetString(buffer, len, output.GetAllocator());
    peripherals.AddMember("date", date, output.GetAllocator());
    peripherals.AddMember("type", "simulation", output.GetAllocator());
    peripherals.AddMember("elapsed_time", elapsed_time, output.GetAllocator());
    peripherals.AddMember("time_step", timeDelta, output.GetAllocator());

    Value simulation(kArrayType);
    output.AddMember("simulation", simulation, output.GetAllocator());

    Value actors(kObjectType);

	for (const auto& actor : world.actors) {
        Value actorData(kObjectType);
        actorData.AddMember("id", Value(actor.id.c_str(), output.GetAllocator()), output.GetAllocator());
        actorData.AddMember("type", Value(actor.type == ActorTypes::Car ? "car" : "bike", output.GetAllocator()), output.GetAllocator());
        actorData.AddMember("length", actor.length, output.GetAllocator());
        actorData.AddMember("max_velocity", actor.max_velocity * 3.6f, output.GetAllocator());
        actorData.AddMember("acceleration", actor.acceleration, output.GetAllocator());
        actorData.AddMember("deceleration", actor.deceleration, output.GetAllocator());
        actorData.AddMember("acceleration_exponent", actor.acceleration_exp, output.GetAllocator());
        actorData.AddMember("waiting_period", actor.insertAfter, output.GetAllocator());
        actorData.AddMember("start_id", Value(world.int_to_string[actor.path.front()].c_str(), output.GetAllocator()), output.GetAllocator());
        actorData.AddMember("end_id", Value(world.int_to_string[actor.path.back()].c_str(), output.GetAllocator()), output.GetAllocator());

        actors.AddMember(Value(actor.id.c_str(), output.GetAllocator()), actorData, output.GetAllocator());
	}

	return output;
}

void addFrame(world_t& world, Document& out, const bool final) {
    Value frame(kObjectType);
    Value intersectionFrame(kObjectType);
    Value actorFrame(kObjectType);

    // Lambda function to create json object to add to output.
	auto a = [&actorFrame, &final, &out](const Actor* actor, const Street* street, const float percent, bool active) {
		Value obj(kObjectType);
        obj.AddMember("road", Value(street->id.c_str(), out.GetAllocator()), out.GetAllocator());
        obj.AddMember("percent_to_end", percent, out.GetAllocator());
        obj.AddMember("distance_to_side", actor->distanceToRight * 10.0f, out.GetAllocator());
        if (final){
            obj.AddMember("start_time", actor->start_time, out.GetAllocator());
            obj.AddMember("end_time", actor->end_time, out.GetAllocator());
        }

        actorFrame.AddMember(Value(actor->id.c_str(), out.GetAllocator()), obj, out.GetAllocator());
	};

    auto c = [&intersectionFrame, &out, &world](const Intersection* intersection) {
        Value obj(kObjectType);
        Value green(kArrayType);
        Value red(kArrayType);

        int index = 0;
        for (const auto inboundRoad : intersection->inbound){
            if (index == intersection->green){
                green.PushBack(Value(inboundRoad->id.c_str(), out.GetAllocator()), out.GetAllocator());
            } else {
                red.PushBack(Value(inboundRoad->id.c_str(), out.GetAllocator()), out.GetAllocator());
            }
            index++;
        }

        obj.AddMember("green", green, out.GetAllocator());
        obj.AddMember("red", red, out.GetAllocator());
        intersectionFrame.AddMember(Value(world.int_to_string[intersection->id].c_str(), out.GetAllocator()), obj, out.GetAllocator());
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
			int first = actor->path.front();
			Street* street = intersection.outbound.find(first)->second;
			if (!actor->outputFlag) {
				a(actor, street, 0.0f, false);
				actor->outputFlag = true;
			}
		}

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

    frame.AddMember("agents", actorFrame, out.GetAllocator());
    frame.AddMember("intersections", intersectionFrame, out.GetAllocator());

	if (frame.Size() > 0) {
        out["simulation"].PushBack(frame, out.GetAllocator());
	}
}

bool save(const std::string& file, const Document& out) {
	std::ofstream ofs(file);

	if (ofs.is_open()) {
        OStreamWrapper osw(ofs);
        Writer<OStreamWrapper> writer(osw);
        out.Accept(writer);
		ofs.close();
        return true;
	}
    std::cerr << "Failed to save to " << file << std::endl;
    return false;
}

bool dumpSpt(spt_t Tree, const char* fname){
    void* carTreePtr =  Tree.array;
    unsigned char* carTreeChar = static_cast<unsigned char*>(carTreePtr);
    std::string ostring = base64_encode(carTreeChar,  Tree.size * Tree.size * sizeof(int));

    std::ofstream f(fname);
    f << ostring;
    f.close();
    return true;

//
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