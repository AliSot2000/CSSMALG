#pragma once

#include "actors.hpp"

#define MIN_DISTANCE_BETWEEN_VEHICLES 1.0f // There should be atleast half a meter distance between vehicles
#define LANE_WIDTH 2 // A lane is per default 2 meters

typedef std::vector<Actor*>::iterator TrafficIterator;

/*
	Finds all vehicles which are in between minDistance and maxDistance

	@param street Selected street in which vehicle is stored
	@param vehicle Index of vehicle in street->traffic
	@param minDistance discards all vehicles which have a distance less than minDistance
	@param maxDistance discards all vehicles with a distance larger than maxDistance
	@param start Pointer where first vehicle will be stored
	@param end Pointer where first vehicle which does not satisfy conditions is stored


	Street is not allowed to be constant here, because we will use these iterators to sort the algorithm later
*/
void trafficInDrivingDistance(Street& street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end);

/*
	Finds maximum distance a car can drive forward in given street.

	@param street Selected street in which vehicle is stored
	@param vehicle Index of vehicle in street->traffic
	@param timeDelta How much time has errupted since last frame. In seconds.

	@param trafficStart Iterator to first vehicle which is in driving distance
	@param trafficEnd Iterator to last vehicle which is in driving distance

	@returns Returns a float containing the maximum distance a car is allowed to drive forward.
*/
float maxSpaceInFrontOfVehicle(const Street& street, const Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd);

/*
	Choses the optimal lane for a car and returns the maximal distance it is allowed to drive forward.
	Bikes will not switch  lanes, cars will go left and right

	@param street Selected street in which vehicle is stored
	@param vehicle Index of vehicle in street->traffic
	@param timeDelta How much time has errupted since last frame. In seconds.

	@param trafficStart Iterator to first vehicle which is in driving distance
	@param trafficEnd Iterator to last vehicle which is in driving distance

	@returns Returns a float containing the maximum distance a car is allowed to drive forward.

*/
float choseLaneGetMaxDrivingDistance(const Street& street, Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd);

/*
	Updates all vehicles in all streets

	@param world World instance to update
	@param timeDelta Time past since last frame

	@returns Void
*/
void updateStreets(world_t* world, const float timeDelta);

