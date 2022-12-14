#include <string>
#include <iostream>
#include <map>

#include "update.hpp"
#include "io.hpp"
#include "actors.hpp"
#include "routing.hpp"
#include "base64.hpp"

bool loadFile(const std::string file, json* input)
{
    std::ifstream f(file);
    if (f.is_open()) {
        f >> *input;
        f.close();
        return true;
    }
    std::cerr << "Failed to load " << file << std::endl;
    return false;
}

bool hasPrecompute(const json* map)
{
    return map->contains("world") && map->contains("carTree") && map->contains("bikeTree");
}

void importMap(world_t* world, json* map, bool doTrafficLights)
{
    assert(world->streets.size() == 0 && "Streets is not empty");
    // Data will be packed more neatly when first creating array with given size
    world->intersections = std::vector<Intersection>(map->at("intersections").size());
    world->IntersectionPtr = std::vector<Intersection*>(map->at("intersections").size());

    int32_t index = 0;
    for (const auto& [_, data] : map->at("intersections").items()) {
        // Filling look up tables
        world->string_to_int[data["id"]] = index;
        world->int_to_string[index] = data["id"];

        Intersection& intersection = world->intersections[index];
        intersection.id = index;
        if (doTrafficLights && data.contains("trafficSignal")) {
            intersection.hasTrafficLight = data["trafficSignal"];
        }
        world->IntersectionPtr[index] = &world->intersections[index];
        index++;
    }

    // Data will be packed more neatly when first creating array with given size
    world->streets = std::vector<Street>(map->at("roads").size());
    world->StreetPtr = std::vector<Street*>(map->at("roads").size());
    std::map<std::string, street_t*> street_map;

    index = 0;
    for (const auto& [_, data] : map->at("roads").items()) {
        Street& street = world->streets[index];
        street.id = data["id"];
        street.length = data["distance"];
//        assert(street.length > 20 && "Street is too short");
        street.width = LANE_WIDTH * data["lanes"].size();
        street.speedlimit = static_cast<float>(data["speed_limit"]) / 3.6f;
        if (data.contains("oppositeStreetId")) {
            street.opposite_id = data["oppositeStreetId"];
        }

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
            }
            else {
                std::cerr << "Unknown street type: " << lane["type"] << std::endl;
            }
            for (int i = 1; i < data["lanes"].size(); ++i) {
                assert(data["lanes"][i]["type"] == lane["type"] && "All lanes must have same type");
            }
        }

        street.start = world->string_to_int[data["intersections"]["start"]["id"]];
        street.end = world->string_to_int[data["intersections"]["end"]["id"]];

        if (street.type != StreetTypes::OnlyCar) {
            world->intersections[street.start].outboundBike[street.end] = &street;
        }
        if (street.type != StreetTypes::OnlyBike) {
            world->intersections[street.start].outboundCar[street.end] = &street;
        }
        world->intersections[street.end].inbound.push_back(&street);

        street_map[street.id] = &street;
        world->StreetPtr[index] = &world->streets[index];
        index++;
    }

    world->empty = {
        .start = -1,
        .end = -1,
        .type = StreetTypes::Both,
        .width = 0,
        .length = 0,
        .speedlimit = 0,
        .id = "NO_ROUT",
    };
    world->string_to_int["NO_ROUT"] = -1;
    world->int_to_string[-1] = "NO_ROUT";

    connectOpposite(world, street_map);
}

void connectOpposite(world_t* world, const std::map<std::string, street_t*> lookupVector)
{
    # pragma omp parallel for default(none) shared(world, lookupVector, std::cerr)
    for (auto& street : world->streets) {
        if (street.opposite_id != "empty") {
            try {
                street.opposite = lookupVector.at(street.opposite_id);
            }
            catch (const std::out_of_range& oor) {
                std::cerr << "Opposite street not found: " << street.opposite_id << std::endl;
            }
        }

        // Compute overtaking part
        // Overtaking on a street is possible iff:
        // - The street is one lane wide
        // - The street accommodates both bikes and cars
        // - The opposite Street is given
        // - The Speed limit is greater than 30km/h
        if (street.width / LANE_WIDTH == 1 && street.type == StreetTypes::Both && street.opposite != nullptr && street.speedlimit > 8.3f) {
            street.allowOvertake = true;
        }
        else {
            street.allowOvertake = false;
        }
    }
}

void importAgents(world_t* world, json* agents, spt_t* carsSPT, spt_t* bikeSPT)
{
    assert(world->actors.size() == 0 && "Agents is not empty");
    world->actors = std::vector<Actor*>(agents->at("bikes").size() + agents->at("cars").size());
    std::cout << "importing " << agents->at("bikes").size() << " bikes and " << agents->at("cars").size() << " cars" << std::endl;
    int index = 0;
    int failed = 0;

    // Import Bikes
    for (const auto& [name, data] : agents->at("bikes").items()) {
        Actor* actor = new Actor();

        // Set that shit
        actor->type = ActorTypes::Bike;
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = data["length"];

        actor->max_velocity = static_cast<float>(data["max_velocity"]) / 3.6f; // Convert km/h to m/s
        actor->target_velocity = 50 / 3.6f;

        actor->acceleration = data["acceleration"];
        actor->deceleration = data["deceleration"];
        actor->acceleration_exp = data["acceleration_exponent"];

        actor->insertAfter = data["waiting_period"];
        actor->id = name;

        actor->start_id = world->string_to_int[data["start_id"]];
        actor->end_id = world->string_to_int[data["end_id"]];

        actor->path = retrievePath(bikeSPT, actor->start_id, actor->end_id);

        if ((actor->start_id != -1 && actor->end_id != -1) || actor->path.empty()) { // Well this is also a stupid mistace to have it to == and ||
            for (auto& intersection : world->intersections) {
                if (intersection.id == actor->start_id) {
                    intersection.waitingToBeInserted.push_back(actor);
                    break;
                }
            }
        }
        else {
            failed++;
        }

        world->actors.at(index) = actor;
        index++;
    }
    for (const auto& [name, data] : agents->at("cars").items()) {
        Actor* actor = new Actor();

        // Set that shit
        actor->type = ActorTypes::Car; // TODO THIS FUCKING LINE OF MY IDIOT BRAIN WAS IT
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = data["length"];

        actor->max_velocity = static_cast<float>(data["max_velocity"]) / 3.6f; // Convert km/h to m/s
        actor->target_velocity = 50 / 3.6f;

        actor->acceleration = data["acceleration"];
        actor->deceleration = data["deceleration"];
        actor->acceleration_exp = data["acceleration_exponent"];

        actor->insertAfter = data["waiting_period"];
        actor->id = name;

        actor->start_id = world->string_to_int[data["start_id"]];
        actor->end_id = world->string_to_int[data["end_id"]];

        actor->path = retrievePath(carsSPT, actor->start_id, actor->end_id);

        // Make sure the path exists.
        if (actor->start_id != -1 && actor->end_id != -1) {
            for (auto &intersection: world->intersections) {
                if (intersection.id == actor->start_id) {
                    intersection.waitingToBeInserted.push_back(actor);
                    break;
                }
            }
        }
        else {
            failed++;
        }

        world->actors.at(index) = actor;
        index++;
    }

    std::cout << "Found " << failed << " agents with impossible destinations" << std::endl;
}

json exportWorld(const world_t* world, const float& time, const float& timeDelta, const json* originMap)
{
    json output;

    output["setup"]["map"] = *originMap;

    output["peripherals"] = {};
    output["peripherals"]["date"] = "Ich weiss doch ned wie mer date in c++ bechunt?"; // TODO Figure this out
    output["peripherals"]["type"] = "simulation";
    output["peripherals"]["elapsed_time"] = time;
    output["peripherals"]["time_step"] = timeDelta;

    output["simulation"] = std::vector<json>();
    int no_path = 0;

    for (const auto& actor : world->actors) {
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
        obj["travel_distance"] = distanceFromPath(world, actor);
        obj["street_path"] = StreetPath(actor, world);
        obj["vertex_path"] = getPath(actor, world);
        if (actor->path.empty()) {
            obj["start_crossing_id"] = "NO_PATH_FOUND";
            obj["end_crossing_id"] = "NO_PATH_FOUND";
        }
        else {
            obj["start_crossing_id"] = world->int_to_string.at(actor->start_id);
            obj["end_crossing_id"] = world->int_to_string.at(actor->end_id);
        }
        no_path += actor->path.empty() ? 1 : 0;
    }
    std::cout << "No path found with  " << no_path << " agents." << std::endl << std::endl;
    return output;
}

void addFrame(world_t* world, json* out, const bool final)
{
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
        if (final) {
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
        for (const auto inboundRoad : intersection->inbound) {
            if (index == intersection->green) {
                obj["green"].push_back(inboundRoad->id);
            }
            else {
                obj["red"].push_back(inboundRoad->id);
            }
            index++;
        }
    };

    // Iterate through the actors on the street and update its distance.
    for (const auto& street : world->streets) {
        for (const auto& actor : street.traffic) {
            const float percent = 1.0f - (actor->distanceToIntersection / street.length);
            a(actor, &street, percent, true);
        }
    }

    for (auto& intersection : world->intersections) {
        // Initial output so the simulation knows how many actors there are
        for (const auto& actor : intersection.waitingToBeInserted) {
//            assert(actor->start_id == intersection.id && "Actor start id does not match intersection id");
            Street* street;
            if (actor->path.empty()) {
                street = &world->empty;
            }
            else {
                int first = actor->path.front();
                if (actor->type == ActorTypes::Car) {
                    street = intersection.outboundCar.find(first)->second;
                }
                else {
                    street = intersection.outboundBike.find(first)->second;
                }
            }
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

    frame["agents"] = actorFrame;
    frame["intersections"] = intersectionFrame;

    if (frame.size() > 0) {
        out->at("simulation").push_back(frame);
    }
}

void save(const std::string file, const json* out)
{
    std::ofstream f(file);

    if (f.is_open()) {
        f << std::setw(4) << *out << std::endl;
        f.close();
    }
    else {
        std::cerr << "Failed to save to " << file << std::endl;
    }
}

#ifdef SINGLE_FILE_EXPORT
void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input,  const world_t* world, const std::string dir)
{
    for (int i = 0; i < carTree.size; i++) {
        // Determine File Name and create a struct
        std::string intCarfile = dir + "car_" + world->int_to_string.at(i) + ".json";
        std::string intBikeFile = dir + "bike_" + world->int_to_string.at(i) + ".json";

        std::map<std::string, std::map<std::string, bool>> carReachable = {};
        std::map<std::string, std::map<std::string, bool>> bikeReachable = {};
        carReachable[world->int_to_string.at(i)] = {};
        bikeReachable[world->int_to_string.at(i)] = {};

        for (int j = 0; j < carTree.size; j++) {
            carReachable[world->int_to_string.at(i)][world->int_to_string.at(j)] = carTree.array[i * carTree.size + j] != -1;
            bikeReachable[world->int_to_string.at(i)][world->int_to_string.at(j)] = bikeTree.array[i * bikeTree.size + j] != -1;
        }
        nlohmann::json carJson;
        carJson["carTree"] = carReachable;
        nlohmann::json bikeJson;
        bikeJson["bikeTree"]= bikeReachable;

        // Save the struct to a file
        save(intCarfile, &carJson);
        save(intBikeFile, &bikeJson);
    }
}
#else
void exportSPT(const spt_t& carTree, const spt_t& bikeTree, const json& input, json& output, const world_t* world)
{
    std::map<std::string, std::map<std::string, bool>> carReachable = {};
    std::map<std::string, std::map<std::string, bool>> bikeReachable = {};


    for (int i = 0; i < carTree.size; i++) {
        carReachable[world->int_to_string.at(i)]= {};
        bikeReachable[world->int_to_string.at(i)]= {};
    }

    #pragma omp parallel for default(none) shared(carTree, carReachable, world, bikeTree, bikeReachable)
    for (int i = 0; i < carTree.size; i++) {
        for (int j = 0; j < carTree.size; j++) {
            if (carTree.array[i * carTree.size + j] == -1) {
                carReachable[world->int_to_string.at(i)][world->int_to_string.at(j)] = carTree.array[i * carTree.size + j] != -1;
            }
            if (bikeTree.array[i * bikeTree.size + j] == -1) {
                bikeReachable[world->int_to_string.at(i)][world->int_to_string.at(j)] = bikeTree.array[i * bikeTree.size + j] != -1;
            }
        }
    }
    output["carTree"] = carReachable;
    output["bikeTree"] = bikeReachable;
}
#endif




void importSPT(spt_t* carTree, spt_t* bikeTree, const json* input, world_t* world)
{
    *carTree = {
        .array = nullptr,
        .size = static_cast<int>(world->intersections.size()),
    };
    // Creating empty SPT.
    *bikeTree = {
        .array = nullptr,
        .size = static_cast<int>(world->intersections.size()),
    };

    // Get the String
    std::string carTreeB64 = input->at("carTree");
    std::string bikeTreeB64 = input->at("bikeTree");

    // Convert to std::vector<unsigned char>
    std::vector<BYTE> carTreeBytes = base64_decode(carTreeB64);
    std::vector<BYTE> bikeTreeBytes = base64_decode(bikeTreeB64);

    // Allocate Memory for copying
    BYTE* carTreePtr = new BYTE[carTree->size * carTree->size * sizeof(int)];
    BYTE* bikeTreePtr = new BYTE[bikeTree->size * bikeTree->size * sizeof(int)];

    // Copy to allocated Memory
    std::copy(carTreeBytes.begin(), carTreeBytes.end(), carTreePtr);
    std::copy(bikeTreeBytes.begin(), bikeTreeBytes.end(), bikeTreePtr);

    void* carTreeVoidPtr = static_cast<void*>(carTreePtr);
    void* bikeTreeVoidPtr = static_cast<void*>(bikeTreePtr);

    carTree->array = static_cast<int*>(carTreeVoidPtr);
    bikeTree->array = static_cast<int*>(bikeTreeVoidPtr);

    for (int i = 0; i < carTree->size; i++) {
        for (int j = 0; j < carTree->size; j++) {
            std::cout << carTree->array[i * carTree->size + j] << " ";
        }
        std::cout << std::endl;
    }
}

bool binDumpSpt(spt_t* Tree, const char* file_name)
{
    void *carTreePtr = Tree->array;
    unsigned char *carTreeChar = static_cast<unsigned char *>(carTreePtr);
    std::string ostring = base64_encode(carTreeChar, Tree->size * Tree->size * sizeof(int));

    std::ofstream f(file_name);
    f << ostring;
    f.close();
    return true;
}

void jsonDumpStats(const float& avgTime, json* output, world_t* world, const bool final)
{
    (*output)["avgTime"] = avgTime;
    (*output)["intersections"] = std::vector<json>();
    (*output)["streets"] = std::vector<json>();

    // Get data from intersections
    for (auto& intersection : world->intersections) {
        json obj = {};
        obj["id"] = world->int_to_string.at(intersection.id);
        obj["bikeFlow"] = intersection.bike_flow_accumulate / avgTime;
        obj["carFlow"] = intersection.car_flow_accumulate / avgTime;
        obj["id"] = world->int_to_string.at(intersection.id);
        intersection.car_flow_accumulate = 0.0f;
        intersection.bike_flow_accumulate = 0.0f;
        output->at("intersections").push_back(obj);
    }

    // Get data from streets
    for (auto& street : world->streets) {
        json obj = {};
        obj["id"] = street.id;
        obj["bikeFlow"] = street.flow_accumulate_bike / (street.width / LANE_WIDTH);
        obj["bikeDensity"] = street.density_accumulate_bike / (street.width / LANE_WIDTH);
        obj["carFlow"] = street.flow_accumulate_car / (street.width / LANE_WIDTH);
        obj["carDensity"] = street.density_accumulate_car / (street.width / LANE_WIDTH);
        obj["id"] = street.id;
        if (final) {
            obj["total_passing_traffic_bike"] = street.total_traffic_count_bike;
            obj["total_passing_traffic_car"] = street.total_traffic_count_car;
        }
        street.flow_accumulate_bike = 0.0f;
        street.density_accumulate_bike = 0.0f;
        street.flow_accumulate_car = 0.0f;
        street.density_accumulate_car = 0.0f;
        output->at("streets").push_back(obj);
    }
}


bool binLoadTree(spt_t* SPT, const char* file_name, const world_t* world)
{
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

    SPT->size = static_cast<int>(world->intersections.size());
    SPT->array = new int[SPT->size * SPT->size];

    // Copy data to non-temporary memory
    std::copy(tempVectorPtr, tempVectorPtr + SPT->size * SPT->size, SPT->array);
    f.close();
    return true;
}

void exportAgents(json* out, const world_t* world)
{
    (*out)["bikes"] = {};
    (*out)["cars"] = {};

    int empty = 0;

    for (auto& agent : world->actors) {
        if (agent->path.empty()) {
            empty++;
            continue;
        }

        json obj = {};
        obj["length"] = agent->length;
        obj["max_velocity"] = agent->max_velocity * 3.6f;
        obj["acceleration"] = agent->acceleration;
        obj["deceleration"] = agent->deceleration;
        obj["acceleration_exponent"] = agent->acceleration_exp;
        obj["waiting_period"] = agent->insertAfter;
        obj["start_id"] = world->int_to_string.at(agent->start_id);
        obj["end_id"] = world->int_to_string.at(agent->end_id);
        obj["path"] = std::vector<int>();
        for (int i = 0; i < agent->path.size(); i++) {
            obj["path"].push_back(agent->path.front());
            agent->path.pop();
        }
        if (agent->type == ActorTypes::Car) {
            out->at("cars")[agent->id] = obj;
        }
        else if (agent->type == ActorTypes::Bike) {
            out->at("bikes")[agent->id] = obj;
        }
    }
    std::cout << "Number of Actors with empty Path: " << empty << std::endl;
}

void printSPT(const spt_t* SPT)
{
    int temp = SPT->size;
    temp = GetNumberOfDigits(temp) + 3;
    std::cout << std::left << std::setw(temp) << std::setfill(' ') << " ";
    std::cout << "| ";

    for (int i = 0; i < SPT->size; ++i) {
        std::cout << std::left << std::setw(temp) << std::setfill(' ') <<  i;
    }
    std::cout << std::endl;
    for (int i = 0; i < SPT->size + 1; ++i) {
        std::cout << std::left << std::setw(temp) << std::setfill('-') << "-";
    }

    std::cout << std::endl;
    for (int i = 0; i < SPT->size; i++) {
        std::cout << std::left << std::setw(temp) << std::setfill(' ') << i;
        std::cout << "| ";
        for (int j = 0; j < SPT->size; j++) {
            std::cout << std::left << std::setw(temp) << std::setfill(' ') <<  SPT->array[i * SPT->size + j];
        }
        std::cout << std::endl;
    }
}

unsigned int GetNumberOfDigits (unsigned int i)
{
    return i > 0 ? (int) log10 ((double) i) + 1 : 1;
}