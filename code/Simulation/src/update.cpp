
#include <algorithm>
#include <cmath>
#include <cassert>
#include <iostream>
#include <stdexcept>

#include "update.hpp"

void trafficInDrivingDistance(Street& street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end) {

	auto& traffic = street.traffic;
	
	// Find all elements infront of vehicle which are in range of a collision if the vehicle would move forward
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

float maxSpaceInFrontOfVehicle(const Street& street, const Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd) {

	if (actor->distanceToCrossing <= 0.0f) 
		return 0.0f;

	const float distance = actor->current_velocity * timeDelta;

	float maxForwardDistance = std::min(distance, actor->distanceToCrossing); // don't overshoot crossing (go beyond the road)
	const float actorRearEnd = actor->distanceToCrossing + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES; // TODO rear end doesn't need min distance

    for (TrafficIterator iter = trafficStart; iter != trafficEnd; iter++) {
        // If space is less than MIN_DISTANCE_BETWEEN_VEHICLES then there is no space to drive forward
		Actor* other = *iter; // Get pointer to actor of iterator (with *)

		if (actor == other) {
            continue;
        }

		// they are in the same lane, thus collision could happen
		if (actor->distanceToRight == other->distanceToRight) { // TEST IF SAME LANE AND RETURN SPACE TO FORWARD VEHICLE

			const float otherRearEnd = other->distanceToCrossing + other->length + MIN_DISTANCE_BETWEEN_VEHICLES; // TODO rear end doesn't need min distance

			// Check if they are already colliding, this should only happen when car is trying to swap lanes
			if ((otherRearEnd >= actor->distanceToCrossing && other->distanceToCrossing <= actor->distanceToCrossing) ||
				(actorRearEnd >= other->distanceToCrossing && actor->distanceToCrossing <= other->distanceToCrossing)) {
				maxForwardDistance = 0.0f;
				continue;
			}

            // Calculates maximum distance vehicle is allowed to move forward
            maxForwardDistance = std::min(maxForwardDistance, actor->distanceToCrossing - otherRearEnd);
		}
	}

	assert(maxForwardDistance >= 0.0f && "Vehicle can not drive backwards.");
	return maxForwardDistance;
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

float choseLaneGetMaxDrivingDistance(const Street& street, Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd) {

	assert((street.type != StreetTypes::OnlyCar || actor->type != ActorTypes::Bike) && "Bike is not allowed on this street!");
	assert((street.type != StreetTypes::OnlyBike || actor->type != ActorTypes::Car) && "Car is not allowed on this street!");

	if(actor->type == ActorTypes::Bike) { // Bikes are never allowed to overtake on another lane!
        return maxSpaceInFrontOfVehicle(street, actor, timeDelta, trafficStart, trafficEnd);
    }

	const float distance = actor->current_velocity * timeDelta;
	float allowedDistance = maxSpaceInFrontOfVehicle(street,  actor, timeDelta, trafficStart, trafficEnd);

    // Try if there are open lanes
    const int originLane = actor->distanceToRight;
    int maxDistanceLane = actor->distanceToRight;

    // Swaps maxDistanceLane if allowed distance to drive in other lane is higher
    auto checkNewDistance = [&]() {
        float newAllowedDistance = maxSpaceInFrontOfVehicle(street, actor, timeDelta, trafficStart, trafficEnd);
        if (newAllowedDistance > allowedDistance || (newAllowedDistance == allowedDistance && actor->distanceToRight < maxDistanceLane)) {
            maxDistanceLane = actor->distanceToRight;
            allowedDistance = newAllowedDistance;
        }
    };

    // Car could go faster but is not able to
    if (allowedDistance < distance) {

        // This while loop is efficient because the traffic in front has been cached, hence no new lookups will appear
        // Furthermore there are at most c * #Lanes many vehicles in front, which could be in driving range
        while (actor->distanceToRight + LANE_WIDTH < street.width) {
            // there is still space to go left
            actor->distanceToRight += LANE_WIDTH;
            checkNewDistance();
        }
    }

    // Same as above, but checks for free lanes on the left.
    actor->distanceToRight = originLane;
    while (actor->distanceToRight > 0.0f) {
        actor->distanceToRight -= LANE_WIDTH;
        checkNewDistance();
    }

    // This distinction removes vehicles trying to switch to lanes more to the right when standing still at the crossing.
    if (allowedDistance > 0.0f) {
        actor->distanceToRight = maxDistanceLane;
    }
    else {
        actor->distanceToRight = originLane;
    }

	return allowedDistance;
}

void sortStreet(TrafficIterator& start, TrafficIterator& end) {
	std::sort(start, end, [](const Actor* a, const Actor* b) {
        // Lexicographical order, starting with distanceToCrossing and then distanceToRight
		if (a->distanceToCrossing == b->distanceToCrossing) {
            // this if statement make sure that no vehicles have the same ordering
            if (a->distanceToRight == b->distanceToRight) {
                //throw std::runtime_error("Two Vehicles with identical position");
                a < b;
            }
            return a->distanceToRight < b->distanceToRight;
		}
		return a->distanceToCrossing < b->distanceToCrossing;
	});
}

bool tryInsertInNextStreet(crossing_t& crossing, Actor* actor, float timeDelta) {
	Street* target = crossing.outbound[actor->path.front()];
	TrafficIterator targetStart;
	TrafficIterator targetEnd;
	trafficInDrivingDistance(*target, target->length - actor->length, target->length, &targetStart, &targetEnd);

	Actor dummy = *actor;
	dummy.distanceToRight = 0;
	dummy.distanceToCrossing = target->length - dummy.length;
	while (dummy.distanceToRight + LANE_WIDTH <= target->width) {
        // TODO Since Velocity is 0, insert fails. use rbegin() and find the first vehicles like that.
		if (maxSpaceInFrontOfVehicle(*target, &dummy, timeDelta, targetStart, targetEnd) > 0.0f) {
			actor->distanceToCrossing = dummy.distanceToCrossing;
			actor->distanceToRight = dummy.distanceToRight;
			actor->path.pop();
			target->traffic.push_back(actor);
			return true;
		}
        if (actor->type == ActorTypes::Bike) { // Bikes are never allowed to overtake on another lane!
            break;
        }
        dummy.distanceToRight += LANE_WIDTH;
	}
	return false;
}

void updateCrossings(world_t* world, const float timeDelta) {
	
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
		if (crossing.currentPhase <= 0.0f) {
			crossing.green = (crossing.green + 1) % (crossing.inbound.size());
			crossing.currentPhase = crossing.greenPhaseDuration;
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
				break; // I dont know if removing an element from a vector during iteration would lead to good code, hence break
			}
		}

	}
}

void updateStreets(world_t* world, const float timeDelta) {
	for (auto& street : world->streets) {
		for (int32_t i = 0; i < street.traffic.size(); i++) {

			Actor* actor = street.traffic[i];
			const float distance = actor->current_velocity * timeDelta;
			const float wantedDistanceToCrossing = std::max(0.0f, actor->distanceToCrossing - (distance));
			const float maxDistance = actor->distanceToCrossing + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES;

			TrafficIterator start;
			TrafficIterator end;

			// Find all traffic which could be colliding with vehicle
			trafficInDrivingDistance(street, wantedDistanceToCrossing, maxDistance, &start, &end);

			float maxDrivingDistance = choseLaneGetMaxDrivingDistance(street, actor, timeDelta, start, end);
            Actor* frontVehicle = nullptr;

            // Compute updated stuff
            actor->distanceToCrossing -= maxDrivingDistance; //TODO needs to be inspected
            actor->current_velocity += std::max(actor->current_acceleration * timeDelta, actor->max_velocity);
            actor->current_acceleration = (frontVehicle == nullptr) ?
                    actor->acceleration *
                        (1
                        - std::pow(actor->current_velocity / actor->target_velocity, actor->acceleration_exp)
                        - (dynamicBrakingDistance(actor, -1*actor->current_velocity) / maxDrivingDistance)) : // Case when the actor is in the front of the queue.
                    actor->acceleration *
                        (1
                        - std::pow(actor->current_velocity / actor->target_velocity, actor->acceleration_exp)
                        - (dynamicBrakingDistance(actor, frontVehicle->current_velocity - actor->current_velocity) / maxDrivingDistance));       // Case when the actor is in the back of the queue. TODO delta might need to be inverted

            // Will make sure traffic is still sorted
			sortStreet(start, end);
		}
	}
}

float dynamicBrakingDistance(const Actor* actor, const float &delta_velocity) {
    return MIN_DISTANCE_BETWEEN_VEHICLES + actor->current_velocity * SAFETY_TIME_HEADWAY + (delta_velocity * actor->current_velocity) / (2 * std::sqrt(actor->acceleration * actor->deceleration));
}
