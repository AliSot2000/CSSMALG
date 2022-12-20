#include <iostream>
#include <iomanip>
#include <vector>
#include <cstdlib>
#include <string>
#include <chrono>

#include "actors.hpp"
#include "routing.hpp"
#include <cassert>
// #include <omp.h>

static unsigned long long
x=1234567890987654321ULL,c=123456123456123456ULL,
y=362436362436362436ULL,z=1066149217761810ULL,t;

#define MWC (t=(x<<58)+c, c=(x>>6), x+=t, c+=(x<t), x)
#define XSH ( y^=(y<<13), y^=(y>>17), y^=(y<<43) )
#define CNG ( z=6906969069LL*z+1234567 )
#define KISS (MWC+XSH+CNG)

int randint(int min, int max)
{
    return static_cast<int>(KISS % (max - min + 1) + min);
}

void choseRandomPath(const world_t* world, spt_t* spt, int& start, int& end)
{
    if (world->intersections.size() == 0) {
        std::cerr << "There are no intersections." << std::endl;
        return;
    }
    start = randint(0, static_cast<int>(world->intersections.size()) - 1);
    end = start;
    int antiInfinitLoop = 0;
    while (antiInfinitLoop < 1000 && (start == end || spt->array[start * spt->size + end] == -1)) {
        start = randint(0, static_cast<int>(world->intersections.size()) - 1);
        end = randint(0, static_cast<int>(world->intersections.size()) - 1);
        ++antiInfinitLoop;
    }
    if (start == end) {
        end = (start + 1) % spt->size;
    }
}

void createRandomActors(world_t* world, spt_t* spt, const ActorTypes& type, const int& minSpeed, const int& maxSpeed,
                        const int& start, const int& numberOfActors, const float& length, const int& max_start_time)
{
// #pragma omp parallel for default(none) shared(world, spt, type, minSpeed, maxSpeed, start, numberOfActors, length, max_start_time)
    for (int i = start;  i < start + numberOfActors; ++i) {
        Actor* actor = new Actor();
        actor->type = type;
        actor->distanceToIntersection = 0.0f;
        actor->distanceToRight = 0;
        actor->length = length;
        actor->max_velocity = static_cast<float>(randint(minSpeed, maxSpeed)) * 0.277778f; // 30km/h to 80km/h
//        actor->width = 1.5f;
        actor->insertAfter = static_cast<float>(randint(0, max_start_time));
        actor->id = std::to_string(std::rand());

        // Filling start and end id via choose Random Path
        choseRandomPath(world, spt, actor->start_id, actor->end_id);
        assert(actor->start_id != actor->end_id && "start_id and end_id are the same");

        actor->path = retrievePath(spt, actor->start_id, actor->end_id);
        if (actor->path.empty()) {
            std::cerr << "Path is empty" << (actor->type == ActorTypes::Bike) << std::endl;
            continue;
        }

        for (auto& intersection : world->intersections) {
            if (intersection.id == actor->start_id) {
                intersection.waitingToBeInserted.push_back(actor);
                break;
            }
        }
        world->actors.at(i) = actor;
    }
}


std::chrono::high_resolution_clock::time_point startMeasureTime(const std::string &task)
{
    std::cout << "Starting task: " << task << std::endl;
    return std::chrono::high_resolution_clock::now();
}

void stopMeasureTime(std::chrono::high_resolution_clock::time_point start_time)
{
    std::cout << "Last task took " << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::high_resolution_clock::now() - start_time).count() / 1000.f << " seconds.\n\n" << std::endl;
}