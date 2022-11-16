
#include <algorithm>
#include <cmath>
#include <cassert>
#include <iostream>

#include "update.hpp"

void trafficInDrivingDistance(Street& street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end) {

	auto& traffic = street.traffic;
	
	// Find all elements infront of vehicle which are in range of a collision if the vehicle would move forward
	// Lower bound binary search (traffic must always be sorted!)
	*start = std::lower_bound(traffic.begin(), traffic.end(), minDistance,
		[](const Actor* a, const float& b) { 
			return a->distanceToCrossing + a->length + MIN_DISTANCE_BETWEEN_VEHICLES <= b;
	});

	*end = std::lower_bound(traffic.begin(), traffic.end(), maxDistance,
		[](const Actor* a, const float& b) { 
			return a->distanceToCrossing < b;
	});
		
	/*
	// This code somehow does not compile, even though it has exactly the same data as lower bound

	*end = std::upper_bound(traffic.begin(), traffic.end(), maxDistance,
		// TODO check if correct, could be that a must be of type Actor** a!!!
		[](const Actor* a, const float& b) { 
			return a->distanceToCrossing > b;
	});
	*/
}

float maxSpaceInFrontOfVehicle(const Street& street, const Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd) {

	if (actor->distanceToCrossing <= 0.0f) 
		return 0.0f;

	const float distance = actor->speed * timeDelta;

	TrafficIterator iter = trafficStart;

	float maxForwardDistance = std::min(distance, actor->distanceToCrossing); // dont overshoot crossing
	const float actorRearEnd = actor->distanceToCrossing + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES;
	for (TrafficIterator iter = trafficStart; iter != trafficEnd; iter++) {
		// If space is less than MIN_DISTANCE_BETWEEN_VEHICLES then there is no space to drive forward
		Actor* other = *iter;

		if (actor == other)
			continue;

		// they are in the same lane, thus collision could happen
		if (actor->distanceToRight == other->distanceToRight) { // TEST IF SAME LANE AND RETURN SPACE TO FORWARD VEHICLE

			const float otherRearEnd = other->distanceToCrossing + other->length + MIN_DISTANCE_BETWEEN_VEHICLES;

			// Check if they are already colliding, this should only happen when car is trying to swap lanes
			if ((otherRearEnd > actor->distanceToCrossing && other->distanceToCrossing < actor->distanceToCrossing) ||
				(actorRearEnd > other->distanceToCrossing && actor->distanceToCrossing < other->distanceToCrossing)) {
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

float choseLaneGetMaxDrivingDistance(const Street& street, Actor* actor, const float& timeDelta, const TrafficIterator& trafficStart, const TrafficIterator& trafficEnd) {

	assert((street.type != StreetTypes::OnlyCar || actor->type != ActorTypes::Bike) && "Bike is not allowed on this street!");
	assert((street.type != StreetTypes::OnlyBike || actor->type != ActorTypes::Car) && "Car is not allowed on this street!");

	if(actor->type == ActorTypes::Bike) // Bikes are never allowed to overtake on another lane!
		return maxSpaceInFrontOfVehicle(street, actor, timeDelta, trafficStart, trafficEnd);

	const float distance = actor->speed * timeDelta;
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
			while (actor->distanceToRight + actor->width < street.width) {
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

void updateStreets(world_t* world, const float timeDelta) {
	for (auto& street : world->streets) {
		for (int32_t i = 0; i < street.traffic.size(); i++) {

			Actor* actor = street.traffic[i];
			const float distance = actor->speed * timeDelta;
			const float wantedDistanceToCrossing = std::max(0.0f, actor->distanceToCrossing - (distance));
			const float maxDistance = actor->distanceToCrossing + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES;

			TrafficIterator start;
			TrafficIterator end;

			// Find all traffic which could be colliding with vehicle
			trafficInDrivingDistance(street, wantedDistanceToCrossing, maxDistance, &start, &end);

			float maxDrivingDistance = choseLaneGetMaxDrivingDistance(street, actor, timeDelta, start, end);
			actor->distanceToCrossing -= maxDrivingDistance;
			
			// Will make sure traffic is still sorted
			std::sort(start, end, [](const Actor* a, const Actor* b) {
				// this if statement make sure that no vehicles have the same ordering
				if (a->distanceToCrossing == b->distanceToCrossing) {
					return a < b;
				}
				return a->distanceToCrossing <= b->distanceToCrossing;
			});
		}
	}
}
