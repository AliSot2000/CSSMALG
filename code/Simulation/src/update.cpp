
#include <algorithm>
#include <cmath>
#include <cassert>
#include <iostream>
#include <stdexcept>

#include "update.hpp"
#include <omp.h>

//void trafficInDrivingDistance(Street* street, const float& minDistance, const float& maxDistance, TrafficIterator* start, TrafficIterator* end) {
//
//	auto& traffic = street->traffic;
//
//	// Find all elements in front of vehicle which are in range of a collision if the vehicle would move forward
//	// Lower bound binary search (traffic must always be sorted!)
//	*start = std::lower_bound(traffic.begin(), traffic.end(), minDistance,
//		[](const Actor* a, const float& b) {
//			return a->distanceToIntersection + a->length + MIN_DISTANCE_BETWEEN_VEHICLES <= b;
//	});
//
//	*end = std::upper_bound(traffic.begin(), traffic.end(), maxDistance,
//		[](const float& b, const Actor* a) {
//			return a->distanceToIntersection > b;
//	});
//}

FrontVehicles GetFrontVehicles(const Street* street, const Actor* actor, const TrafficIterator& trafficStart, TrafficIterator& trafficEnd) {
    FrontVehicles f;

    // Go through array and always update the frontVehicles if a new matching vehicle is found.
    for (TrafficIterator iter = trafficStart; iter != trafficEnd; iter++) {
        Actor *other = *iter; // Get pointer to actor of iterator (with *)

        if (actor == other) {
            trafficEnd = iter;
            return f;
        }

        assert(other->distanceToRight <= street->width && "Vehicle is not on the street!");

        // We can iterate through like that since the traffic is sorted by distanceToIntersection.
        if (actor->distanceToRight == other->distanceToRight) {
            f.frontVehicle = other;
        } else if (actor->distanceToRight == other->distanceToRight + LANE_WIDTH) {
            f.frontVehicleRight = other;
        } else if (actor->distanceToRight == other->distanceToRight - LANE_WIDTH) {
           f.frontVehicleLeft = other;
        }
    }
    // Don't update traffic end iterator since we want to iterate through all vehicles.
    return f;
}

FrontVehicles GetCollisionVehicles(const Street* street, const Actor* actor, const TrafficIterator start){
    FrontVehicles f;

    // Go through array and always update the frontVehicles if a new matching vehicle is found.
    for (TrafficIterator iter = start; iter != street->traffic.end(); iter++) {
        Actor *other = *iter; // Get pointer to actor of iterator (with *)
        //Ignoring the actor itself
        if (other == actor) {
            continue;
        }

        // Return if the other vehicle is behind the actor and cannot collide
        if (other->distanceToIntersection > actor->distanceToIntersection + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES) {
            return f;
        }

        assert(other->distanceToRight <= street->width && "Vehicle is not on the street!");

        // We can iterate through like that since the traffic is sorted by distanceToIntersection.
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

Actor* moveToOptimalLane(Street* street, Actor* actor) {
    assert((street->type != StreetTypes::OnlyCar || actor->type != ActorTypes::Bike) && "Bike is not allowed on this street!");
    assert((street->type != StreetTypes::OnlyBike || actor->type != ActorTypes::Car) && "Car is not allowed on this street!");

    TrafficIterator start = street->traffic.begin();
    TrafficIterator end = street->traffic.end();
    // Get front vehicles
    FrontVehicles frontActors = GetFrontVehicles(street, actor, start, end);

    // Don't update the shit if we are a bike in a normal street.
    if (actor->type == ActorTypes::Bike && street->type == StreetTypes::Both) {
        return frontActors.frontVehicle;
    }

    // Locate vehicles which could possibly collide
    FrontVehicles collisionVehicle = GetCollisionVehicles(street, actor, end);

    // Check in front
    float frontDistance = actor->distanceToIntersection;
    Actor* OptimalFrontActor = frontActors.frontVehicle;
    int distanceToRight = actor->distanceToRight;

    // Update front distance if there is a vehicle in front
    if (frontActors.frontVehicle != nullptr) {
        frontDistance = actor->distanceToIntersection - (frontActors.frontVehicle->distanceToIntersection + frontActors.frontVehicle->length);
    }

    // Check if you can move to a left lane
    if (actor->distanceToRight < street->width - LANE_WIDTH) {
        // Preemptively set the movable distance.
        float leftDistance = actor->distanceToIntersection;

        // Update distance
        if (frontActors.frontVehicleLeft != nullptr) {
            leftDistance =
                    actor->distanceToIntersection - (frontActors.frontVehicleLeft->distanceToIntersection + frontActors.frontVehicleLeft->length);
        }

        // Check if the left lane has a greater distance the actor can travel.
        if (leftDistance > frontDistance) {
            // Check for a collision with subsequent vehicle.
            if (collisionVehicle.frontVehicleLeft == nullptr // If there's no vehicle to colide, proceed
                || (collisionVehicle.frontVehicleLeft->distanceToIntersection > actor->distanceToIntersection + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES // Actor is enough ahead of collision vehicle.
                    || collisionVehicle.frontVehicleLeft->distanceToIntersection + collisionVehicle.frontVehicleLeft->length + MIN_DISTANCE_BETWEEN_VEHICLES < actor->distanceToIntersection)) // Actor is enough behind collision vehicle.
            {

                frontDistance = leftDistance;
                distanceToRight = actor->distanceToRight + LANE_WIDTH;
                OptimalFrontActor = frontActors.frontVehicleLeft;
            }

        }
    }

    // Check if the actor can move on a right lane
    if (actor->distanceToRight > 0){
        // Preemptively set the movable distance.
        float rightDistance = actor->distanceToIntersection;

        // Update front distance if there is a vehicle in front
        if (frontActors.frontVehicleRight != nullptr) {
            rightDistance =
                    actor->distanceToIntersection - (frontActors.frontVehicleRight->distanceToIntersection + frontActors.frontVehicleRight->length);
        }

        // Prioritize right lane, that's why greater or equal than.
        // Check if the right lane has a greater distance the actor can travel.
        if (rightDistance >= frontDistance) {
            if (collisionVehicle.frontVehicleRight == nullptr // There's no vehicle in front of the actor.
            || (collisionVehicle.frontVehicleRight->distanceToIntersection > actor->distanceToIntersection + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES // Actor is enough ahead.
                || collisionVehicle.frontVehicleRight->distanceToIntersection + collisionVehicle.frontVehicleRight->length + MIN_DISTANCE_BETWEEN_VEHICLES < actor->distanceToIntersection))
            {
            OptimalFrontActor = frontActors.frontVehicleRight;
            distanceToRight = actor->distanceToRight - LANE_WIDTH;
            }
        }

    }

    // Update Distance to right, i.e. move actor to optimal lane.
    actor->distanceToRight = distanceToRight;
    return OptimalFrontActor;
}
/*void sortStreet(TrafficIterator& start, TrafficIterator& end) {
    std::sort(start, end, [](const Actor* a, const Actor* b) {
        // Lexicographical order, starting with distanceToIntersection and then distanceToRight
        if (a->distanceToIntersection == b->distanceToIntersection) {
            // this if statement make sure that no vehicles have the same ordering
            if (a->distanceToRight == b->distanceToRight) {
                //throw std::runtime_error("Two Vehicles with identical position");
                return a < b;
            }
            return a->distanceToRight < b->distanceToRight;
        }
        return a->distanceToIntersection < b->distanceToIntersection;
    });
}*/

void teleportActor(Actor* actor, Street* target, int distanceToRight){
    actor->tempDistanceToRight = distanceToRight;
    actor->distanceToIntersection = target->length - actor->length;
    actor->target_velocity = target->speedlimit;
}

void updateCount(Street* street, Actor* actor){
    if (actor->type == ActorTypes::Bike){
        street->total_traffic_count_bike++;
    } else {
        street->total_traffic_count_car++;
    }
}

// Updated Version of Alex to handle zero velocity vehicles.
bool tryInsertInNextStreet(Intersection* intersection, Actor* actor, World* world) {
    assert(!actor->path.empty() && "tryInsertInNextStreet may not be called with an Actor that has an empty path!");
    Street* target = (actor->type == ActorTypes::Bike) ? intersection->outboundBike.at(actor->path.front()) : intersection->outboundCar.at(actor->path.front());

    // Empty, insert immediately and return
    if (target->traffic.empty()){
        teleportActor(actor, target, 0);
        updateCount(target, actor);
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
                 * <-----------distanceToIntersection--------------->[iter->length]<-----MinDistance---->[actor->length]
                 * -----------------------------------------------------------------------------------------------------
                 */
                if (target->length - ((*iter)->distanceToIntersection + (*iter)->length + MIN_DISTANCE_BETWEEN_VEHICLES + actor->length) > 0.0f) {
                    teleportActor(actor, target, 0);
                    updateCount(target, actor);
                    return true;
                }
                else {
                    // Since the list is sorted, it doesn't make sense to compare the insertion to the next vehicle.
                    return false;
                }
            }
        }

        // If unexpectedly the right most street is empty. Insert into right, and update the actor
        teleportActor(actor, target, 0);
        updateCount(target, actor);
        return true;
    }


    // Keep in mind which lanes are available.
    // bool lanes[target->width / LANE_WIDTH];
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
        if (target->length - ((*iter)->distanceToIntersection + (*iter)->length + MIN_DISTANCE_BETWEEN_VEHICLES + actor->length) > 0.0f) {
            // Insert and update the actor.
            teleportActor(actor, target, other->distanceToRight);
            updateCount(target, actor);
            return true;
        } else {
            // Lane has been checked, number of availalbe lanes are rerduced
            lanes.at(other->distanceToRight / LANE_WIDTH) = true;
            avlLanes--;
        }
    }
    // std::cerr << "I'm fucking stupid since I was not able to foresee this case happening" << std::endl;
    // This occurs when there are exactly as many vehicles as there are lanes. We don't get to the avgLanes == 0,
    // therefore, we don't return the false and exit the for loop. Then we end up here.
    return false;

}

void updateIntersectionPhase(Intersection* intersection, float timeDelta, bool stupidIntersections) {
    intersection->currentPhase -= timeDelta;

    // Change street for which the light is green
    if (stupidIntersections){
        // Perform the stupid intersection algorithm, i.e. don't check if the street is empty
        if (intersection->currentPhase <= 0.0f) {
            intersection->green = (intersection->green + 1) % static_cast<int>(intersection->inbound.size());
            intersection->currentPhase = intersection->greenPhaseDuration;
            intersection->outputFlag = true;
        }
    } else {
        if (intersection->currentPhase <= 0.0f) {
            // Forloop to prevent an infinite while loop
            // Go to next inbound street if a given inbound street is empty.
            for (std::size_t i = 0; i < intersection->inbound.size(); i++){
                intersection->green = (intersection->green + 1) % static_cast<int>(intersection->inbound.size());
                if (intersection->inbound.at(intersection->green)->traffic.size() > 0){
                    break;
                }
            }
            intersection->outputFlag = true;
            intersection->currentPhase = intersection->greenPhaseDuration;
        }
    }
}

void singleIntersectionStrideUpdate(world_t* world, const float timeDelta, bool stupidIntersections, const float current_time, const int stride, const int offset) {
    // Move so no thread is colliding with another thread.
    for (int32_t x = offset; x < world->intersections.size(); x += stride) {
        Intersection* intersection = world->IntersectionPtr.at(x);

        if (intersection->hasTrafficLight){
            updateIntersectionPhase(intersection, timeDelta, stupidIntersections);

            Street* street = intersection->inbound.at(intersection->green);
            for (TrafficIterator iter = street->traffic.begin(); iter != street->traffic.end(); iter++) {
                Actor* actor = *iter;

                if (actor->distanceToIntersection >= DISTANCE_TO_CROSSING_FOR_TELEPORT)
                    // No vehicle is close enough to change street
                    break;

                // Everything that can be done in parallel, executed in parallel
                if (actor->path.empty()) {
                    // Actor has arrived at its target
                    actor->outputFlag = false; // make sure new active status is outputted once
                    actor->end_time = current_time;
                    actor->arrived = true;
                    intersection->needsUpdate = true;
                    break;
                }

                if (tryInsertInNextStreet(intersection, actor, world)) {
                    actor->Teleport = true;
                    intersection->needsUpdate = true;
                    intersection->car_flow_accumulate += 1.0f * static_cast<float>(actor->type == ActorTypes::Car);
                    intersection->bike_flow_accumulate += 1.0f * static_cast<float>(actor->type == ActorTypes::Bike);
                    break; // I don't know if removing an element from a vector during iteration would lead to good code, hence break
                }
            }
        } else {
           for (int i = 0; i < intersection->inbound.size(); i++){
               int index = (i + intersection->green) % static_cast<int>(intersection->inbound.size());
               Street* street = intersection->inbound.at(index);

               // Ignore empty streets
               if (street->traffic.size() == 0){
                   continue;
               }

               Actor* actor = street->traffic.front();

               // Check if front actor is eligible to change street
               if (actor->distanceToIntersection >= DISTANCE_TO_CROSSING_FOR_TELEPORT){
                   continue;
               }

               // Actor has arrived at its destination
               if (actor->path.empty()) {
                   // Actor has arrived at its target
                   actor->outputFlag = false; // make sure new active status is outputted once
                   actor->end_time = current_time;
                   actor->arrived = true;
                   intersection->needsUpdate = true;
                   break;
               }

               if (tryInsertInNextStreet(intersection, actor, world)) {
                   actor->Teleport = true;
                   intersection->needsUpdate = true;
                   intersection->car_flow_accumulate += 1.0f * static_cast<float>(actor->type == ActorTypes::Car);
                   intersection->bike_flow_accumulate += 1.0f * static_cast<float>(actor->type == ActorTypes::Bike);
                   intersection->green = index;
                   break; // I don't know if removing an element from a vector during iteration would lead to good code, hence break
               }
           }
        }

        // Adding new traffic to street needs to happen last, to reduce the likelihood of deadlocks with too many cars.
        if (intersection->waitingToBeInserted.size() > 0) {
            Actor* actor = intersection->waitingToBeInserted[0];
            // Ignoring the actor if it is not it's start time yet.
            if (actor->insertAfter <= current_time && tryInsertInNextStreet(intersection, actor, world)) {
                actor->start_time = current_time * static_cast<float>(actor->start_time == -1.0f)
                        + actor->start_time * static_cast<float>(actor->start_time != -1.0f); // only set the start time if the if the start time
                actor->Teleport = true;
                intersection->needsUpdate = true;
            }
        }
    }
}

void updateData(world_t* world){
    for (int32_t x = 0; x < world->intersections.size(); ++x) {
        Intersection* intersection = world->IntersectionPtr.at(x);

        // Skipping intersection that don't need to be updated
        if (!intersection->needsUpdate){
            continue;
        }

        // Resetting the needsUpdate flag
        intersection->needsUpdate = false;

        if (intersection->hasTrafficLight){

            Street* street = intersection->inbound.at(intersection->green);
            for (TrafficIterator iter = street->traffic.begin(); iter != street->traffic.end(); iter++) {
                Actor* actor = *iter;
                // Everything that can be done in parallel, executed in parallel
                if (actor->arrived) {
                    // Actor has arrived at its target
                    actor->arrived = false;
                    street->traffic.erase(iter);
                    intersection->arrivedFrom.push_back({actor, street});
                    break;
                }

                if (actor->Teleport) {
                    actor->Teleport = false;
                    actor->distanceToRight = actor->tempDistanceToRight;
                    street->traffic.erase(iter);
                    Street* target = (actor->type == ActorTypes::Bike) ? intersection->outboundBike.at(actor->path.front()) : intersection->outboundCar.at(actor->path.front());
                    target->traffic.push_back(actor);
                    actor->path.pop();
                    break; // I don't know if removing an element from a vector during iteration would lead to good code, hence break
                }
            }
        } else {
            for (int i = 0; i < intersection->inbound.size(); i++){
                Street* street = intersection->inbound.at(i);

                // Ignore empty streets
                if (street->traffic.size() == 0){
                    continue;
                }

                Actor* actor = street->traffic.front();

                // Actor has arrived at its destination
                if (actor->arrived) {
                    // Actor has arrived at its target
                    actor->arrived = false; // make sure new active status is outputted once
                    street->traffic.erase(street->traffic.begin());
                    intersection->arrivedFrom.push_back({actor, street});
                    break;
                }

                if (actor->Teleport) {
                    actor->Teleport = false;
                    actor->distanceToRight = actor->tempDistanceToRight;
                    street->traffic.erase(street->traffic.begin());
                    Street* target = (actor->type == ActorTypes::Bike) ? intersection->outboundBike.at(actor->path.front()) : intersection->outboundCar.at(actor->path.front());
                    target->traffic.push_back(actor);
                    actor->path.pop();
                    break; // I don't know if removing an element from a vector during iteration would lead to good code, hence break
                }
            }
        }

        // Adding new traffic to street needs to happen last, to reduce the likelihood of deadlocks with too many cars.
        if (intersection->waitingToBeInserted.size() > 0) {
            Actor* actor = intersection->waitingToBeInserted[0];
            // Ignoring the actor if it is not it's start time yet.
            if (actor->Teleport) {

                actor->Teleport = false;
                actor->distanceToRight = actor->tempDistanceToRight;
                intersection->waitingToBeInserted.erase(intersection->waitingToBeInserted.begin());
                Street* target = (actor->type == ActorTypes::Bike) ? intersection->outboundBike.at(actor->path.front()) : intersection->outboundCar.at(actor->path.front());
                target->traffic.push_back(actor);
                actor->path.pop();
            }
        }
    }
}

bool singleStreetStrideUpdate(world_t* world, const float timeDelta, const int stride, const int offset) {
    bool actorMoved = false;

    // Move so no thread is colliding with another thread.
//    std::vector<Street>::iterator start_iter = world->streets.begin();
//    std::advance(start_iter, offset);

//    #pragma omp parallel for private(empty, actorMoved)
    for (int32_t x = offset; x < world->streets.size(); x+=stride){
//    for (auto& street : world->streets) {
        Street *street = world->StreetPtr.at(x);
        int bikes = 0;
        int cars = 0;

        for (int32_t i = 0; i < street->traffic.size(); i++) {
			Actor* actor = street->traffic[i];

            if (actor->type == ActorTypes::Bike) {
                bikes++;
            } else {
                cars++;
            }

			const float distance = actor->current_velocity * timeDelta;
//			const float wantedDistanceToIntersection = std::max(0.0f, actor->distanceToIntersection - distance);
//			const float maxDistance = actor->distanceToIntersection + actor->length + MIN_DISTANCE_BETWEEN_VEHICLES;

//			TrafficIterator start;
//			TrafficIterator end;

			// Find all traffic which could be colliding with vehicle
//			trafficInDrivingDistance(street, wantedDistanceToIntersection, maxDistance, &start, &end);
            Actor* frontVehicle = moveToOptimalLane(street, actor);

            float maxDrivableDistance = actor->distanceToIntersection;
            float movement_distance = std::min(distance, actor->distanceToIntersection); // Don't overshoot intersection

            // Compute updated stuff
            if (frontVehicle != nullptr) {
                maxDrivableDistance = std::min(maxDrivableDistance, actor->distanceToIntersection
                                                                     - (frontVehicle->length
                                                                     + frontVehicle->distanceToIntersection
                                                                     + MIN_DISTANCE_BETWEEN_VEHICLES));
                movement_distance = std::min(distance, actor->distanceToIntersection
                                                      - (frontVehicle->length
                                                      + frontVehicle->distanceToIntersection
                                                      + MIN_DISTANCE_BETWEEN_VEHICLES));

                assert(frontVehicle->distanceToIntersection + frontVehicle->length <
                       actor->distanceToIntersection - movement_distance + MIN_DISTANCE_BETWEEN_VEHICLES);
            }

            actor->distanceToIntersection -= movement_distance;
            actorMoved = actorMoved || movement_distance > 0.0f;
            actor->time_spent_waiting += static_cast<float>(movement_distance == 0.0f) * timeDelta;
            // Clamping distance
            if (actor->distanceToIntersection < 0.01f){actor->distanceToIntersection = 0;}

            // assert(std::isnan(actor->distanceToIntersection) == false && "Distance to Intersection is nan");
            // assert(std::isinf(actor->distanceToIntersection) == false && "Distance to Intersection is inf");
            // assert(actor->distanceToIntersection >= -10.0f && "Distance to intersection needs to be >= -10.0f");

            actor->current_velocity = std::min(std::max(actor->current_acceleration * timeDelta + actor->current_velocity, 0.0f),
                                               actor->max_velocity);
            if (actor->current_velocity < 0.01f){actor->current_velocity = 0;}
            // assert(std::isnan(actor->current_velocity) == false && "Current Velocity is not nan");
            // assert(std::isinf(actor->current_velocity) == false && "Current Velocity is not inf");


            // Only update the speed with formula if the vehicle is not at the end of the street (div by zero error)
            // and if the distance to intersection was not updated beforehand to 0.
            if (actor->distanceToIntersection > 0.0f && maxDrivableDistance > 0.0f) {

                // Simplifying assumption. An Actor can at maximum only "see" up to the next intersection. This is
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
                actor->current_velocity = 0.0f;
            }
            // Will make sure traffic is still sorted
//			sortStreet(start, end);
            std::sort(street->traffic.begin(), street->traffic.end(), [](const Actor* a, const Actor* b) {
                // Lexicographical order, starting with distanceToIntersection and then distanceToRight
                if (a->distanceToIntersection == b->distanceToIntersection) {
                    // this if statement make sure that no vehicles have the same ordering
                    if (a->distanceToRight == b->distanceToRight) {
                        return a < b;
                    }
                    return a->distanceToRight < b->distanceToRight;
                }
                return a->distanceToIntersection < b->distanceToIntersection;
            });
            assert(std::is_sorted(street->traffic.begin(), street->traffic.end(), [](const Actor* a, const Actor* b) {
                // Lexicographical order, starting with distanceToIntersection and then distanceToRight
                if (a->distanceToIntersection == b->distanceToIntersection) {
                    // this if statement make sure that no vehicles have the same ordering
                    if (a->distanceToRight == b->distanceToRight) {
                        return a < b;
                    }
                    return a->distanceToRight < b->distanceToRight;
                }
                return a->distanceToIntersection < b->distanceToIntersection;
            }) && "Street is sorted");

            // assert(std::isnan(actor->current_acceleration) == false && "Acceleration is not nan");
            // assert(std::isinf(actor->current_acceleration) == false && "Acceleration is not inf");
//            if (actor->distanceToIntersection <= 1.0f && actor->distanceToIntersection > 0.0f) {
//                assert(actor->current_velocity >= 0.01f && "Acceleration needs to be >= -10.0f");
//            }
            actor->distanceToFront = maxDrivableDistance;
        }
        street->density_accumulate_bike += static_cast<float>(bikes) / street->length;
        street->flow_accumulate_bike += static_cast<float>(bikes) / timeDelta;
        street->density_accumulate_car += static_cast<float>(cars) / street->length;
        street->flow_accumulate_car += static_cast<float>(cars) / timeDelta;
	}

    return actorMoved;
}

bool updateStreets(world_t* world, const float timeDelta){
    bool actorMoved = false;

    #pragma omp parallel for reduction(||:actorMoved)  default(none) shared(world, timeDelta)
    for (int32_t i = 0; i < 128; i++) {
        actorMoved = singleStreetStrideUpdate(world, timeDelta, 128, i) || actorMoved;
    }

    return actorMoved || emptynessOfStreets(world);
}

void updateIntersections(world_t* world, const float timeDelta, bool stupidIntersections, const float current_time){
    #pragma omp parallel for  default(none) shared(world, timeDelta, stupidIntersections, current_time)
    for (int32_t i = 0; i < 128; i++){
        singleIntersectionStrideUpdate(world, timeDelta, stupidIntersections, current_time, 128, i);
    }

    updateData(world);
}

float dynamicBrakingDistance(const Actor* actor, const float &delta_velocity) {
    return MIN_DISTANCE_BETWEEN_VEHICLES + actor->current_velocity * SAFETY_TIME_HEADWAY + (delta_velocity * actor->current_velocity) / (2 * std::sqrt(actor->acceleration * actor->deceleration));
}

void resolveDeadLocks(world_t* world, const float current_time) {
    for (auto& intersection : world->intersections) {
        for (auto& iter : intersection.inbound){
            if (iter->traffic.empty()){
                continue;
            }

            Actor* actor = iter->traffic.front();
            if (actor->current_velocity < 0.01f && actor->distanceToIntersection < DISTANCE_TO_CROSSING_FOR_TELEPORT) {
                intersection.waitingToBeInserted.insert(intersection.waitingToBeInserted.begin(), actor);
                actor->insertAfter = current_time + 5.0f;
                iter->traffic.erase(iter->traffic.begin());
            }

        }
    }
}

bool emptynessOfStreets(world_t* world){
    bool empty = true;
    #pragma omp parallel for reduction(&&:empty) default(none) shared(world)
    for (int32_t i = 0; i < world->streets.size(); i++) {
        empty = world->streets.at(i).traffic.empty() && empty;
    }
    return empty;
}