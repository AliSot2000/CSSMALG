#pragma once

#include <cstdint>

class Actor {

public:
	virtual void doAction() = 0;
};

class Car : public Actor {

public:
		void doAction() override;
};

class Bicycle : public Actor {

public:
	void doAction() override;
};