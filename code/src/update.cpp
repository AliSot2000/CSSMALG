
#include "actors.hpp"

#define MIN_TRAFFIC_OFFSET_LENGTH 1.0f // There should be atleast half a meter distance between vehicles
#define MIN_TRAFFIC_OFFSET_WIDTH 0.5f // There should be atleast half a meter distance between vehicles

#define PRECISION 2.0f * std::numeric_limits<float>::epsilon()

bool hasArrivedAtCrossing(Street* street, int32_t vehicleIndex) {
	Actor* actor = street->traffic[vehicleIndex];
	const bool distanceFactor = actor->distanceToCrossing <= PRECISION;

	if (vehicleIndex == 0)
		return distanceFactor;

	Actor* other = street->traffic[vehicleIndex - 1];
	bool hasNoSpaceFront = other->distanceToCrossing + other->length + MIN_TRAFFIC_OFFSET_LENGTH >= actor->distanceToCrossing;

	return other->waitingAtCrossing && hasNoSpaceFront;
}

bool hasEnoughSpaceForDriving(Street* street, int32_t vehicleIndex) {

	if (vehicleIndex == 0)
		return true;

	Actor* actor = street->traffic[vehicleIndex];
	Actor* other = street->traffic[vehicleIndex - 1];
	
	bool hasSpaceFront = other->distanceToCrossing + other->length + MIN_TRAFFIC_OFFSET_LENGTH < actor->distanceToCrossing;
	
	return hasSpaceFront;
}

bool hasSpaceForOvertake(Street* street, int32_t vehicleIndex) {

	if (vehicleIndex == 0)
		return false;

	Actor* actor = street->traffic[vehicleIndex];
	Actor* other = street->traffic[vehicleIndex - 1];

	if (actor->speed <= other->speed)
		// overtaking doesnt make sense when one isnt faster
		return false;

	bool isOvertaking = actor->distanceToRight > 0.0f;
	bool hasSpaceLeft = other->distanceToRight + other->width + actor->width + MIN_TRAFFIC_OFFSET_WIDTH < street->width;

	if (!isOvertaking) {
		// Distance to car in front does not matter, since there is still space left on the breadth of the street.
		return hasSpaceLeft;
	}

	// Double overtaking is not allowed for now
	return false;

}

void updateStreets(world_t* world, float timeStepS) {
	for (auto& street : world->streets) {
		const size_t n = street.traffic.size();
		for(size_t i = 0; i < n; i++) { 
			Actor* actor = street.traffic[i];

			if (hasArrivedAtCrossing(&street, i)) {
				actor->waitingAtCrossing = true;
			}
			else if (hasEnoughSpaceForDriving(&street, i)) {
				float maxDistance = actor->distanceToCrossing;

				if (i > 0) {
					// dont accidentally overtake front car without testing if there is space on the left
					Actor* front = street.traffic[i - 1];
					maxDistance = front->distanceToCrossing + front->length; // No MIN_TRAFFIC_OFFSET_LENGTH added so that actor can start overtaking in next loop
				}
				
				actor->distanceToCrossing -= std::min(maxDistance, actor->speed * timeStepS);
			}
			else if (hasSpaceForOvertake(&street, i)) {
				// TODO overtake
				Actor* front = street.traffic[i - 1];
				actor->distanceToRight = front->distanceToRight + front->width + MIN_TRAFFIC_OFFSET_WIDTH;
			}

			if (i > 0) {
				// Traffic Ordering checks

				Actor* front = street.traffic[i - 1];

				if (front->distanceToCrossing > actor->distanceToCrossing) {
					// Swaps position between two vehicles if their order based on distance to next crossing is no longer correct.
					street.traffic[i - 1] = actor;
					street.traffic[i] = front;
					float temp = actor->distanceToRight;
					actor->distanceToRight = front->distanceToRight;
					front->distanceToRight = temp;
				}
				else if (actor->distanceToRight > 0.0f && (actor->speed < front->speed)) {
					// This happens when bike has been overtaken by car, they change position and their space to the right
					// Then it happens that bikes are on the left side of the road even though the car infront is gone
					// so one has to reset it to the right
					if (front->distanceToCrossing + front->length + MIN_TRAFFIC_OFFSET_LENGTH < actor->distanceToCrossing) {
						actor->distanceToRight = 0.0f;
					}
				}
			}
		}
	}
}