#pragma once

#include "actors.hpp"

#define MIN_DISTANCE_BETWEEN_VEHICLES 1.0f // Minimum distance in meters between any two vehicles
#define LANE_WIDTH 2 // A lane is per default 2 meters
#define DISTANCE_TO_CROSSING_FOR_TELEPORT 0.5f // If a vehicles distance to the next crossing is lower than this value, it will be considered for crossing
#define SAFETY_TIME_HEADWAY 0.5f // 1.6 seconds headway

// Struct for all vehicles which could be in range for collisions
typedef struct FrontVehicles{
    Actor* frontVehicle = nullptr;
    Actor* frontVehicleLeft = nullptr;
    Actor* frontVehicleRight = nullptr;
} frontVehicles_t;

typedef std::vector<Actor*>::iterator TrafficIterator;

/*
	Finds all vehicles which are in between minDistance and maxDistance

	@param street Selected street in which vehicle is stored
	@param minDistance discards all vehicles which have a distance less than minDistance
	@param maxDistance discards all vehicles with a distance larger than maxDistance
	@param start Pointer where first vehicle will be stored
	@param end Pointer where first vehicle which does not satisfy conditions is stored

	Street is not allowed to be constant here, because we will use these iterators to sort the algorithm later
*/
void trafficInDrivingDistance(Street& street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end);

/*
    Locates the vehicle in front, in front and to the immediate right and in front and to the immediate left
    of the selected actor.

    @param street Selected street in which vehicle is stored
    @param actor Pointer to vehicle in street->traffic

    @returns Returns a FrontVehicle struct containing the front vehicle, the front vehicle to the left and the front vehicle to the right.

*/
FrontVehicles GetFrontVehicles(const Street& street, const Actor* actor);

/*
    Finds the optimal Lane to drive for the vehicle and moves it to said lane. It then returns the
    vehicle in front if there is one.

    @param street Selected street in which vehicle is stored
    @param actor Pointer to vehicle in street->traffic

    @returns Pointer to Vehicle in Front

 */
Actor* moveToOptimalLane(Street& street, Actor* actor);

/*
	Sorts vehicles in a street based on their distance to the next crossing.

	@param start Where to begin sorting
	@param end Where to stop sorting
*/
void sortStreet(TrafficIterator& start, TrafficIterator& end);

/*
	Updates all vehicles in all streets

	@param world, World instance to update
	@param timeDelta Time past since last frame

	@returns Void
*/
void updateStreets(world_t* world, const float timeDelta);

/*
	Checks if there would be a collision for the actor if it was inserted into the next street. The next street is chosen from the actors path.

	@param crossing Crossing at which actor has arrived
	@param actor Actor for which will tested.
	@param timeDelta Time since last frame

	@param Returns true if there is enough space for actor to switch streets.
*/
bool tryInsertInNextStreet(crossing_t& crossing, Actor* actor, float timeDelta);

/*

	Updates crossings, switches green lights and checks if cars can switch streets.

	@param world Simulation container
	@param timeDelta Time since last frame
	@param stupidCrossing TODO

*/
void updateCrossings(world_t* world, const float timeDelta, bool stupidCrossings);

/*
    Compute the desired distance between the vehicle and the border of the next vehicle.

    @param actor The actor for which the desired distance is computed.
    @param deltaVelocity The difference in velocity between the actor and the next vehicle.

    @returns The desired distance between the actor and the border of the next vehicle.

*/
float dynamicBrakingDistance(const Actor* actor, const float& deltaVelocity);