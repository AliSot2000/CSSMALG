# TODOS, Alex puts them here.
    TODO rework: Cars should be input into crossings faster at the beggining
    TODO bug: Intersections dont check if street has cars, but will still do a normal countdown for the green phase
    TODO bug: Bikes are somehow overtaking, even though I thought i made them not...

	TODO feature: Overtaking if opposite street is free

	TODO rename crossings to intersections
	TODO test if crossings switch inbound streets

	CONSTRAINTS:
		If a street has following lanes:
			1. Bike
			2. Car
			3. Car
		They should be added as two seperate streets, one with type OnlyCar and one with OnlyBike.
		This will make sure SPT calculates proper paths

		If between nodes there exists two streets like
			1. OnlyCar
			2. Both
			-> this could lead to unknown behaviour while doing the route planning. 
			   There should always only be one street between two intersections for each actor type

