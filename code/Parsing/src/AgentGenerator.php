<?php

class AgentGenerator
{
    private array $center;
    private int $radius;
    private int $carCounter = 0;

    private array $coordinates;
    private array $nodesIn = array();
    private array $nodesOut = array();
    private array $bikePercentages = array(0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2);

    /**
     * constructor generating center of field and the radius
     * @param float $lon1
     * @param float $lon2
     * @param float $lat1
     * @param float $lat2
     */
    public function __construct(float $lon1, float $lon2, float $lat1, float $lat2)
    {
        $this->coordinates = array("lon1" => $lon1, "lon2" => $lon2, "lat1" => $lat1, "lat2" => $lat2);;
        $this->center = array("lon" => ($lon1 + $lon2) / 2, "lat" => ($lat1 + $lat2) / 2);

        $this->radius = round(min($this->distance($this->center["lon"], $this->center["lat"], $lon1,  $this->center["lat"]), $this->distance($this->center["lon"], $this->center["lat"], $this->center["lon"],  $lat1)) / 3);
    }

    /**
     * main method of class bundling all important other methods
     * @return void
     */
    public function execute(): void {
        $this->readData();
        $this->generateCars();
    }

    /**
     * generates the agents, that are cars
     * @return void
     */
    private function generateCars(): void {
        $carDistribution = $this->calculateCarDistribution();
        // distribution of cars going into the city center
        // 1/4 of going into city center we assume inter city travel and for 1/4 of rest we assume outer city travel
        $direction = array(0.5, 0.5, 0.5, 0.5, 0.55, 0.65, 0.75, 0.85, 0.8, 0.75, 0.65, 0.5, 0.5, 0.5, 0.5, 0.35, 0.3, 0.2, 0.2, 0.25, 0.35, 0.5, 0.5, 0.5);

        $numInNodes = count($this->nodesIn) - 1;
        $numOutNodes = count($this->nodesOut) - 1;

        // generate actors that are cars that spawn each minute
        $carAgents = array();
        foreach ($carDistribution AS $hour => $amount) {
            $secondCounter = 0;
            $amountPerMinute = max(round($amount / 60), 1);
            $totAmount = 0;

            // number of agents going from out to center (+ center to center (+ center to out (+ out to out)))
            $directionAmount = array(round($direction[$hour] * $amount * 0.75),  round($direction[$hour] * $amount), round($amount - $amount * (1 - $direction[$hour]) * 0.25));

            for ($i = 0; $i < 60; $i++) {
                for ($j = 0; $j < $amountPerMinute; $j++) {
                    // pseudo random length in m
                    $length = rand(7, 10) / 2;
                    // pseudo random max velocity in km/h
                    $maxVelocity = rand(100, 250);
                    // pseudo random acceleration in m/s^2
                    $acceleration = rand(150, 500) / 100;
                    // pseudo random deceleration in m/s^2
                    $deceleration = rand(200, 600) / 100;
                    // pseudo random acceleration exponent
                    $accExp = rand(80, 120) / 10;

                    $startId = $endId = 0;

                    if ($totAmount < $directionAmount[0]) {
                        $startId = $this->nodesOut[rand(0, $numOutNodes)];
                        $endId = $this->nodesIn[rand(0, $numInNodes)];
                    } else if ($totAmount < $directionAmount[1]) {
                        while ($startId == $endId) {
                            $startId = $this->nodesIn[rand(0, $numInNodes)];
                            $endId = $this->nodesIn[rand(0, $numInNodes)];
                        }
                    } else if ($totAmount < $directionAmount[2]) {
                        $startId = $this->nodesIn[rand(0, $numInNodes)];
                        $endId = $this->nodesOut[rand(0, $numOutNodes)];
                    } else {
                        while ($startId == $endId) {
                            $startId = $this->nodesOut[rand(0, $numOutNodes)];
                            $endId = $this->nodesOut[rand(0, $numOutNodes)];
                        }
                    }

                    $carAgents[strval($this->carCounter)] = array("start_id" => strval($startId), "end_id" => strval($endId), "length" => $length, "max_velocity" => $maxVelocity, "acceleration" => $acceleration, "deceleration" => $deceleration, "acceleration_exponent" => $accExp, "waiting_period" => $secondCounter);
                    $totAmount++;
                    $this->carCounter++;
                }
                $secondCounter += 60;
            }
        }

        $this->writeJSON(array("cars" => $carAgents), "carAgents");
        unset($carAgents);
    }

    /**
     * calculate how many cars we want to spawn per hour
     * @return array
     */
    private function calculateCarDistribution(): array {
        $area = round($this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon2"], $this->coordinates["lat1"]) *  $this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon1"], $this->coordinates["lat2"]));
        // assumption: at rush hour one new car per 3000m^2 on the whole area of the map per hour
        $maxCarAmount = $area / 3000;
        // assumption with at what hour will there be what percentage of $maxCarAmount spawned
        // increased at morning rush hour, lunch and evening rush hour
        $carDistribution = array(0.05, 0.05, 0.06, 0.75, 0.1, 0.25, 0.4, 0.65, 0.55, 0.45, 0.4, 0.5, 0.5, 0.4, 0.4, 0.55, 0.8, 1, 0.8, 0.5, 0.3, 0.1, 0.075, 0.05);

        foreach ($carDistribution AS &$amount) {
            $amount = round($amount * $maxCarAmount);
        }

        return $carDistribution;
    }

    /**
     * write the result JSON
     * @param array $data
     * @param string $fileName
     * @return void
     */
    private function writeJSON(array $data, string $fileName): void {
        $handle = fopen("../data/$fileName.json", 'w+');

        fwrite($handle, json_encode($data));
        fclose($handle);
    }

    /**
     * reads node data from mapExport.tsim
     * @return void
     */
    private function readData(): void {
        $data = json_decode(file_get_contents("../data/mapExport.tsim"), true)["intersections"];

        foreach ($data AS $intersection) {
            if ($this->distance($intersection["coordinates"]["lon"], $intersection["coordinates"]["lat"], $this->center["lon"], $this->center["lat"]) > $this->radius) {
                $this->nodesOut[] = $intersection["id"];
            } else {
                $this->nodesIn[] = $intersection["id"];
            }
        }
    }

    /**
     * calculate the distance in meters between two pairs of earth coordinates
     * @param float $lon1
     * @param float $lat1
     * @param float $lon2
     * @param float $lat2
     * @return float
     */
    private function distance(float $lon1, float $lat1, float $lon2, float $lat2): float {
        // distance based on haversine formula
        $radius = 6371e3;

        $phi1 = $lat1 * pi() / 180;
        $phi2 = $lat2 * pi() / 180;

        $deltaPhi = ($lat2 - $lat1) * pi() / 180;
        $deltaLambda = ($lon2 - $lon1) * pi() / 180;

        $a = pow(sin($deltaPhi / 2), 2) + cos($phi1) * cos($phi2) * pow(sin($deltaLambda/2), 2);
        $b = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radius * $b;
    }


}
