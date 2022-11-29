
#include <algorithm>
#include <cmath>
#include <cassert>
#include <iostream>
#include <stdexcept>

#include "update.hpp"

void trafficInDrivingDistance(Street& street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end) {

	auto& traffic = street.traffic;
	
	// Find all elements in front of vehicle which are in range of a collision if the vehicle would move forward
	// Lower bound binary search (traffic must always be sorted!)
	*start = std::lower_bound(traffic.begin(), traffic.end(), minDistance,
		[](const Actor* a, const float& b) {
			return a->distanceToCrossing + a->length + MIN_DISTANCE_BETWEEN_VEHICLES <= b; // Todo test if removing min distance has adverse effect.
	});

	*end = std::upper_bound(traffic.begin(), traffic.end(), maxDistance,
		[](const float& b, const Actor* a) {
			return a->distanceToCrossing > b;
	});
}

FrontVehicles GetFrontVehicles(const Street& street, const Actor* actor) {
    FrontVehicles f;

    // Go through array and always update the frontVehicles if a new matching vehicle is found.
    for (auto iter = street.traffic.begin(); iter != street.traffic.end(); iter++) {
        Actor *other = *iter; // Get pointer to actor of iterator (with *)

        if (actor == other) {
            return f;
        }

        assert(other->distanceToRight <= street.width && "Vehicle is not on the street!");

        // We can iterate through like that since the traffic is sorted by distanceToCrossing.
        if (actor->distanceToRight == other->distanceToRight) {
            f.frontVehicle = other;
        } else if (actor->distanceToRight == other->distanceToRight + LANE_WIDTH) {
            f.frontVehicleRight = other;
        } else if (actor->distanceToRight == other->distanceToRight - LANE_WIDTH) {
           f.frontVehicleLeft = other;
        }
    }

    return f;
}

Actor* moveToOptimalLane(Street& street, Actor* actor) {
    assert((street.type != StreetTypes::OnlyCar || actor->type != ActorTypes::Bike) && "Bike is not allowed on this street!");
    assert((street.type != StreetTypes::OnlyBike || actor->type != ActorTypes::Car) && "Car is not allowed on this street!");

    // Get front vehicles
    FrontVehicles f = GetFrontVehicles(street, actor);

    // Check in front
    float frontDistance = actor->distanceToCrossing;
    Actor* OptimalFrontActor = f.frontVehicle;
    int distanceToRight = actor->distanceToRight;

    if (f.frontVehicle != nullptr) {
        frontDistance = actor->distanceToCrossing - (f.frontVehicle->distanceToCrossing + f.frontVehicle->length);
    }

    // Check left lane existence
    if (actor->distanceToRight < street.width - LANE_WIDTH) {

        float leftDistance = actor->distanceToCrossing;

        // Update distance
        if (f.frontVehicleLeft != nullptr) {
            leftDistance =
                    actor->distanceToCrossing - (f.frontVehicleLeft->distanceToCrossing + f.frontVehicleLeft->length);
        }

        if (leftDistance > frontDistance) {
            frontDistance = leftDistance;
            OptimalFrontActor = f.frontVehicleLeft;
            distanceToRight = actor->distanceToRight + LANE_WIDTH;
        }
    }

    // Check right lane existence
    if (actor->distanceToRight > 0){

        float rightDistance = actor->distanceToCrossing;

        // Update distance
        if (f.frontVehicleRight != nullptr) {
            rightDistance =
                    actor->distanceToCrossing - (f.frontVehicleRight->distanceToCrossing + f.frontVehicleRight->length);
        }

        // Prioritize right lane, that's why greater or equal than.
        if (rightDistance >= frontDistance) {
            OptimalFrontActor = f.frontVehicleRight;
            distanceToRight = actor->distanceToRight - LANE_WIDTH;
        }

    }

    // Update Distance to right, i.e. move actor to optimal lane.
    actor->distanceToRight = distanceToRight;
    return OptimalFrontActor;
}

void sortStreet(TrafficIterator& start, TrafficIterator& end) {
	std::sort(start, end, [](const Actor* a, const Actor* b) {
        // Lexicographical order, starting with distanceToCrossing and then distanceToRight
		if (a->distanceToCrossing == b->distanceToCrossing) {
            // this if statement make sure that no vehicles have the same ordering
            if (a->distanceToRight == b->distanceToRight) {
                return a < b;
            }
            return a->distanceToRight < b->distanceToRight;
		}
		return a->distanceToCrossing < b->distanceToCrossing;
	});
}

// Updated Version of Alex to handle zero velocity vehicles.
bool tryInsertInNextStreet(crossing_t& crossing, Actor* actor, float timeDelta) {
    Street* target = crossing.outbound[actor->path.front()];

    // Empty, insert immediately and return
    if (target->traffic.empty()){
        target->traffic.push_back(actor);
        actor->path.pop();
        actor->distanceToRight = 0;
        actor->distanceToCrossing = target->length - actor->length;
        actor->target_velocity = target->speedlimit;
        return true;
    }

    // If the street is both and actor is bike, it may only take right lane
    if (target->type == StreetTypes::Both && actor->type == ActorTypes::Bike) {

        // Move through entire street and only compare the right most vehicle.
        for (auto iter = target->traffic.rbegin(); iter != target->traffic.rend(); iter++) {
            if ((*iter)->distanceToRight == 0) {
                /*
                 * -----------------------------------------------------------------------------------------------------
                 *
                 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --
                 * <-----------distanceToCrossing------------------->[iter->length]<-----MinDistance---->[actor->length]
                 * -----------------------------------------------------------------------------------------------------
                 */
                if (target->length - ((*iter)->distanceToCrossing + (*iter)->length + MIN_DISTANCE_BETWEEN_VEHICLES + actor->length) > 0.0f) {
                    actor->path.pop();
                    target->traffic.push_back(actor);
                    actor->distanceToRight = 0;
                    actor->distanceToCrossing = target->length - actor->length;
                    actor->target_velocity = target->speedlimit;
                    return true;
                }
                else {
                    // Since the list is sorted, it doesn't make sense to compare the insertion to the next vehicle.
                    return false;
                }
            }
        }

        // If unexpectedly the right most street is empty. Insert into right, and update the actor
        actor->path.pop();
        target->traffic.push_back(actor);
        actor->distanceToRight = 0;
        actor->distanceToCrossing = target->length - actor->length;
        actor->target_velocity = target->speedlimit;
        return true;
    }


    // Keep in mind which lanes are available.
    std::vector<bool> lanes(target->width / LANE_WIDTH);
    int avlLanes = static_cast<int>(target->width) / LANE_WIDTH;
    for (int i = 0; i < target->width / LANE_WIDTH; i++) {
        lanes[i] = false;
    }

    // If the vehicle is a car on a both road, and on a car road, it can move to any lane. Also, a bicycle can switch
    // lanes in a pure bike road.

    for (auto iter = target->traffic.rbegin(); iter != target->traffic.rend(); iter++) {
        // If the number of available lanes is 0, return false
        if (avlLanes == 0) {
           return false;
        }

        Actor* other = *iter;

        // Continue if lane has been checked.
        if (lanes.at(other->distanceToRight / LANE_WIDTH)) {
            continue;
        }

        // Space in a lane, we can insert the actor and return true
        if (target->length - ((*iter)->distanceToCrossing + (*iter)->length + MIN_DISTANCE_BETWEEN_VEHICLES + actor->length) > 0.0f) {
            // Insert and update the actor.
            actor->path.pop();
            target->traffic.push_back(actor);
            actor->distanceToRight = other->distanceToRight;
            actor->distanceToCrossing = target->length - actor->length;
            actor->target_velocity = target->speedlimit;
            return true;
        } else {
            // Lane has been checked, number of availalbe lanes are rerduced
            lanes.at(other->distanceToRight / LANE_WIDTH) = true;
            avlLanes--;
        }
    }

    // This occurs when there are exactly as many vehicles as there are lanes. We don't get to the avgLanes == 0,
    // therefore, we don't return the false and exit the for loop. Then we end up here.

    return false;
}

void updateCrossings(world_t* world, const float timeDelta, bool stupidCrossings) {
	for (auto& crossing : world->crossings) {

		if (crossing.waitingToBeInserted.size() > 0) {
			Actor* actor = crossing.waitingToBeInserted[0];
			if (tryInsertInNextStreet(crossing, actor, timeDelta)) {
				crossing.waitingToBeInserted.erase(crossing.waitingToBeInserted.begin());
			}
		}

		if (crossing.inbound.size() == 0)
			continue;

		crossing.currentPhase -= timeDelta;

		// Change street for which the light is green
        if (stupidCrossings){
            crossing.green = (crossing.green + 1) % (crossing.inbound.size());
            crossing.currentPhase = crossing.greenPhaseDuration;
        } else {
            if (crossing.currentPhase <= 0.0f) {
                // Forloop to prevent an infinite while loop
                // Go to next inbound street if a given inbound street is empty.
                for (std::size_t i = 0; i < crossing.inbound.size(); i++){
                    crossing.green = (crossing.green + 1) % (crossing.inbound.size());
                    if (crossing.inbound.at(crossing.green)->traffic.size() > 0){
                        break;
                    }
                }
                crossing.currentPhase = crossing.greenPhaseDuration;
            }
        }

		Street* street = crossing.inbound[crossing.green];
		for (TrafficIterator iter = street->traffic.begin(); iter != street->traffic.end(); iter++) {
			Actor* actor = *iter;
			if (actor->distanceToCrossing >= DISTANCE_TO_CROSSING_FOR_TELEPORT)
				// No vehicle is close enough to change street
				break;

			if (actor->path.empty()) {
				// Actor has arrived at its target
				actor->outputFlag = false; // make sure new active status is outputted once
				street->traffic.erase(iter);
				crossing.arrivedFrom.push_back({actor, street});
				break;
			}

			if (tryInsertInNextStreet(crossing, actor, timeDelta)) {
				street->traffic.erase(iter);
				break; // I don't know if removing an element from a vector during iteration would lead to good code, hence break
			}
		}

	}
}

void updateStreets(world_t* world, const float timeDelta) {
	for (auto& street : world->streets) {
		for (int32_t i = 0; i < street.traffic.size(); i++) {

			Actor* actor = street.traffic[i];
			const float distance = actor->current_velocity * timeDelta;
			const float wantedDistanceToCrossing = std::max(0.0f, actor->distanceToCrossing - distance);
			const float maxDistance = actor->distanceToCrossing + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES;

            // Range in which sorting must be applied
			TrafficIterator start;
			TrafficIterator end;
			trafficInDrivingDistance(street, wantedDistanceToCrossing, maxDistance, &start, &end);

            Actor* frontVehicle = moveToOptimalLane(street, actor);

            float maxDrivableDistance = actor->distanceToCrossing;
            float movement_distance = std::min(distance, actor->distanceToCrossing);

            // Compute updated stuff
            if (frontVehicle != nullptr) {
                maxDrivableDistance = std::min(maxDrivableDistance, actor->distanceToCrossing - (frontVehicle->length
                                                                                                 + frontVehicle->distanceToCrossing
                                                                                                 + MIN_DISTANCE_BETWEEN_VEHICLES));
                movement_distance = std::min(distance, actor->distanceToCrossing -
                                                      (frontVehicle->length
                                                      + frontVehicle->distanceToCrossing
                                                      + MIN_DISTANCE_BETWEEN_VEHICLES));

                assert(frontVehicle->distanceToCrossing + frontVehicle->length <
                       actor->distanceToCrossing - movement_distance + MIN_DISTANCE_BETWEEN_VEHICLES);
            }
            actor->distanceToCrossing -= movement_distance;
            // Clamping distance
            if (actor->distanceToCrossing < 0.01f){actor->distanceToCrossing = 0;}

            actor->current_velocity = std::min(std::max(actor->current_acceleration * timeDelta + actor->current_velocity, 0.0f),
                                               actor->max_velocity);
            if (actor->current_velocity < 0.01f){actor->current_velocity = 0;}

            // Only update the speed with formula if the vehicle is not at the end of the street (div by zero error)
            // and if the distance to crossing was not updated beforehand to 0.
            if (actor->distanceToCrossing > 0.0f && maxDrivableDistance > 0.0f) {

                // Simplifying assumption. An Actor can at maximum only "see" up to the next crossing. This is
                // advantageous both for MPI (If it was to be added) and it doesn't require the addition of a datastructure.
                actor->current_acceleration = (frontVehicle == nullptr) ?
                                              actor->acceleration *
                                              (1
                                               - std::pow(actor->current_velocity / actor->target_velocity,
                                                          actor->acceleration_exp)
                                               - std::pow(dynamicBrakingDistance(actor, -1 * actor->current_velocity) /
                                                          maxDrivableDistance, 2.0f))
                                                                        : // Case when the actor is in the front of the queue.
                                              actor->acceleration *
                                              (1
                                               - std::pow(actor->current_velocity / actor->target_velocity,
                                                          actor->acceleration_exp)
                                               - std::pow(dynamicBrakingDistance(actor, actor->current_velocity - frontVehicle->current_velocity) /
                                                          maxDrivableDistance,
                                                          2.0f));       // Case when the actor is in the back of the queue.
            } else {
                actor->current_acceleration = 0.0f;
            }

            // Will make sure traffic is still sorted
			sortStreet(start, end);
        }
	}
}

float dynamicBrakingDistance(const Actor* actor, const float &delta_velocity) {
    return MIN_DISTANCE_BETWEEN_VEHICLES + actor->current_velocity * SAFETY_TIME_HEADWAY + (delta_velocity * actor->current_velocity) / (2 * std::sqrt(actor->acceleration * actor->deceleration));
}
