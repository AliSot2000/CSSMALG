#pragma once

#include "actors.hpp"

#define MIN_DISTANCE_BETWEEN_VEHICLES 1.0f // There should be at least half a meter distance between vehicles
#define LANE_WIDTH 2 // A lane is per default 2 meters
#define DISTANCE_TO_CROSSING_FOR_TELEPORT 0.5f
#define SAFETY_TIME_HEADWAY 0.5f // 1.6 seconds headway

typedef struct FrontVehicles{
    Actor* frontVehicle = nullptr;
    Actor* frontVehicleLeft = nullptr;
    Actor* frontVehicleRight = nullptr;
} frontVehicles_t;

typedef std::vector<Actor*>::iterator TrafficIterator;

/*
 * Finds all vehicles which are in between minDistance and maxDistance
 *
 * @param street Selected street in which vehicle is stored
 * @param vehicle Index of vehicle in street->traffic
 * @param minDistance discards all vehicles which have a distance less than minDistance
 * @param maxDistance discards all vehicles with a distance larger than maxDistance
 * @param start Pointer where first vehicle will be stored
 * @param end Pointer where first vehicle which does not satisfy conditions is stored
 * Street is not allowed to be constant here, because we will use these iterators to sort the algorithm later
*/
void trafficInDrivingDistance(Street* street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end);

/*
 * Finds maximum distance a car can drive forward in given street.
 *
 * @param street Selected street in which vehicle is stored
 * @param vehicle Index of vehicle in street->traffic
 * @param timeDelta How much time has elapsed since last frame. In seconds.
 *
 * @param trafficStart Iterator to first vehicle which is in driving distance
 * @param trafficEnd Iterator to last vehicle which is in driving distance
 *
 * @returns Returns a float containing the maximum distance a car is allowed to drive forward.
 *
 * ----------------------------------------------------------------------------------------------
 *
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --
 * std::vector{[A5]              [A4]     [A2]     [A1]              [A0]}
 * ----------------------------------------------------------------------------------------------
 * | Max Distance
 * ---------------------------> | Min Distance = actor->distanceToIntersection - distance_traveled
 * IT-END            IT-START
*/
//float maxSpaceInFrontOfVehicle(const Street& street, const Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd);

/*
 * Locates the vehicle in front, in front and to the immediate right and in front and to the immediate left
 * of the selected actor.
 *
 * @param street Selected street in which vehicle is stored
 * @param vehicle Pointer to vehicle in street->traffic
 *
 * @returns Returns a FrontVehicle struct containing the front vehicle, the front vehicle to the left and the front vehicle to the right.

*/
FrontVehicles GetFrontVehicles(const Street& street, const Actor* actor, const TrafficIterator& trafficStart, TrafficIterator& trafficEnd);
/*
 * Gives the three vehicles which could collide with our actor
 */
FrontVehicles GetCollisionVehicles(const Street& street, const Actor* actor, const TrafficIterator start);
/*
 * Finds the optimal Lane to drive for the vehicle and moves it to said lane. It then returns the
 * vehicle in front if there is one.
 *
 * @param street Selected street in which vehicle is stored
 * @param actor Pointer to vehicle in street->traffic
 *
 * @returns Pointer to Vehicle in Front
 */
Actor* moveToOptimalLane(Street& street, Actor* actor);
/*
 * Chooses the optimal lane for a car and returns the maximal distance it is allowed to drive forward.
 * Bikes will not switch  lanes, cars will go left and right
 *
 * @param street Selected street in which vehicle is stored
 * @param vehicle Index of vehicle in street->traffic
 * @param timeDelta How much time has elapsed since last frame. In seconds.
 *
 * @param trafficStart Iterator to first vehicle which is in driving distance
 * @param trafficEnd Iterator to last vehicle which is in driving distance
 *
 * @returns Returns a float containing the maximum distance a car is allowed to drive forward.
*/
// float choseLaneGetMaxDrivingDistance(const Street& street, Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd);

/*
 * Sorts vehicles in a street based on their distance to the next intersection.
 *
 * @param start Where to begin sorting
 * @param end Where to stop sorting
*/
//void sortStreet(TrafficIterator& start, TrafficIterator& end);
void sortStreet(std::vector<Actor*>& traffic);

/*
 * Updates all vehicles in all streets
 *
 * @param world, World instance to update
 * @param timeDelta Time past since last frame
 *
 * @returns True <=> if any actor changed its position.
*/
bool updateStreets(world_t* world, const float timeDelta);

/*
 * Given an Actor, the function tries to insert it into the road adjacent to the intersection that is indicated in the head
 * of its path. Returns true if the actor was inserted, false if no space was in the road
 *
 * @param intersection: Intersection where the actor is currently in the rerouting phase
 * @param actor: Actor to be inserted
 *
 * @returns True <=> if the actor was inserted
*/
bool tryInsertInNextStreet(Intersection* intersection, Actor* actor, World* world);

/*
 * Performs the update light routine of an intersection which hase a traffic light. It selects which lane currently has
 * the green light.
 *
 * @param intersection: Intersection to update
 * @param timeDelta: Time past since last frame
 * @param stupidIntersections: If intersection is stupid or not.
 *
 * @returns void.
*/
void updateIntersectionPhase(Intersection* intersection, float timeDelta, bool stupidIntersections);

/*
 * Updates all Intersections in the world.
 *
 * @param world: World instance to update.
 * @param timeDelta: Time past since last frame. Used for traffic light.
 * @param stupidIntersections: Intersection will not check if a road is empty and still try to route its traffic for the green phase.
 * @param currentTime: Needed to indicate the start and arrival time of the cars.
 *
*/
void updateIntersections(world_t* world, const float timeDelta, bool stupidIntersections, const float current_time);
/*
 * Compute the desired distance between the vehicle and the border of the next vehicle.
 *
 * @param actor The actor for which the desired distance is computed.
 * @param delta_velocity The difference in velocity between the actor and the next vehicle.
 *
 * @returns The desired distance between the actor and the border of the next vehicle.
*/
float dynamicBrakingDistance(const Actor* actor, const float &delta_velocity);

/*
 * If no car could move
*/
void resolveDeadLocks(world_t* world, const float current_time);

bool singleStreetStrideUpdate(world_t* world, const float timeDelta, const int stride, const int offset);

void singleIntersectionStrideUpdate(world_t* world, const float timeDelta, bool stupidIntersections, const float current_time, const int stride, const int offset);