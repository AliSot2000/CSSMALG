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
 * Locates the vehicle in front, in front and to the immediate right and in front and to the immediate left
 * of the selected actor.
 *
 * @param street Selected street in which vehicle is stored
 * @param actor Pointer to vehicle in street->traffic
 * @param trafficStart start of Traffic
 * @param trafficEnd End pointer of traffic
 *
 * @returns Returns a FrontVehicle struct containing the front vehicle, the front vehicle to the left and the front vehicle to the right.
*/
FrontVehicles GetFrontVehicles(const Street* street, const Actor* actor, const TrafficIterator& trafficStart, TrafficIterator& trafficEnd);

/*
 * Gives the three vehicles which could collide with our actor
 *
 * @param street Street to query on
 * @param actor Actor for which collisions are queried
 * @param start Start of traffic
 */
FrontVehicles GetCollisionVehicles(const Street* street, const Actor* actor, const TrafficIterator start);
/*
 * Finds the optimal Lane to drive for the vehicle and moves it to said lane. It then returns the
 * vehicle in front if there is one.
 *
 * @param street Selected street in which vehicle is stored
 * @param actor Pointer to vehicle in street->traffic
 *
 * @returns Pointer to Vehicle in Front
 */
Actor* moveToOptimalLane(Street* street, Actor* actor);

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
float dynamicBrakingDistance(const Actor* actor, const float &delta_velocity, const bool vehicleInFront);

/*
 * If no car could move
 *
 * @param world Pointer to world object
 * @param current_time Timestamp of current time
*/
void resolveDeadLocks(world_t* world, const float current_time);

/**

Updates the actors in a world in a single-street stride pattern.
@param world A pointer to the world object.
@param timeDelta The time delta for the update.
@param stride The stride for the update.
@param offset The offset for the update.
@return True if the update was successful, false otherwise.
*/
bool singleStreetStrideUpdate(world_t* world, const float timeDelta, const int stride, const int offset);

/**

Updates the actors in a world in a single-intersection stride pattern.
@param world A pointer to the world object.
@param timeDelta The time delta for the update.
@param stupidIntersections A flag indicating whether to use the "stupid intersections" update method.
@param current_time The current time of the simulation.
@param stride The stride for the update.
@param offset The offset for the update.
*/
void singleIntersectionStrideUpdate(world_t* world, const float timeDelta, bool stupidIntersections, const float current_time, const int stride, const int offset);

/*
    Checks if streets are empty
*/
bool emptynessOfStreets(world_t* world);

/*
    Teleports the actor 
*/
void teleportActor(Actor* actor, Street* target, int distanceToRight);

/*
    Helper funciton to update the data
*/
void updateData(world_t* world);

/**

Inserts actors into intersections in a single-intersection stride pattern.
@param world A pointer to the world object.
@param current_time The current time of the simulation.
@param stride The stride for the update.
@param offset The offset for the update.
*/
void singleIntersectionStrideUpdateInsert(world_t* world, const float current_time, const int stride, const int offset);
