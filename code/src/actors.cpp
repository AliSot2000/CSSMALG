#include <iostream>

#include "actors.hpp"

void Car::doAction()
{
	std::cout << "I am a car!" << std::endl;
}

void Bicycle::doAction()
{
	std::cout << "I am a Bicyle!" << std::endl;
}
