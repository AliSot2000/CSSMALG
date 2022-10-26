#include <iostream>
#include <vector>

#include "actors.hpp"

int main(int argc, char* argv[]) {

	std::vector<Actor*> actors;
	actors.push_back(new Car());
	actors.push_back(new Bicycle());

	std::cout << "Hello World!" << std::endl;

	actors[0]->doAction();
	actors[1]->doAction();

	for (const Actor* actor : actors)
		delete actor;

	std::cout << "Pointers freed..." << std::endl;

	return 0;
}