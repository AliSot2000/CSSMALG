<?php

class AgentGenerator
{
    private array $center;
    private int $radius;
    private string $prefix;
    private array $coordinates;
    private array $nodesIn = array();
    private array $nodesOut = array();
    private array $unreachable = array();
    private array $bikePercentages = array(0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2);

    /**
     * constructor generating center of field and the radius
     * @param float $lon1
     * @param float $lon2
     * @param float $lat1
     * @param float $lat2
     * @param string $prefix
     */
    public function __construct(float $lon1, float $lon2, float $lat1, float $lat2, string $prefix)
    {
        $this->coordinates = array("lon1" => $lon1, "lon2" => $lon2, "lat1" => $lat1, "lat2" => $lat2);;
        $this->center = array("lon" => ($lon1 + $lon2) / 2, "lat" => ($lat1 + $lat2) / 2);

        $this->radius = round(min($this->distance($this->center["lon"], $this->center["lat"], $lon1,  $this->center["lat"]), $this->distance($this->center["lon"], $this->center["lat"], $this->center["lon"],  $lat1)) / 3);

        $this->prefix = $prefix;
    }

    /**
     * main method of class bundling all important other methods
     * @return void
     */
    public function execute(): void {
        $this->readData();
        $this->generateAgents();
    }

    /**
     * generates the agents
     * @return void
     */
    private function generateAgents(): void {
        $agentAmount = $this->calculateAgentAmount();
        // distribution of cars going into the city center
        // 1/4 of going into city center we assume inter city travel and for 1/4 of rest we assume outer city travel
        $direction = array(0.5, 0.5, 0.5, 0.5, 0.55, 0.65, 0.75, 0.85, 0.8, 0.75, 0.65, 0.5, 0.5, 0.5, 0.5, 0.35, 0.3, 0.2, 0.2, 0.25, 0.35, 0.5, 0.5, 0.5);

        $numInNodes = count($this->nodesIn) - 1;
        $numOutNodes = count($this->nodesOut) - 1;

        // generate agents
        foreach ($this->bikePercentages AS $bikePercentage) {
            for ($repetitions = 0; $repetitions < 10; $repetitions++) {

                $carAgents = array();
                $bikeAgents = array();

                $secondCounter = 0;
                $totVehicles = 0;

                foreach ($agentAmount as $hour => $amount) {
                    $amountPerMinute = max(round($amount / 60), 1);

                    // number of agents going from out to center (+ center to center (+ center to out (+ out to out)))
                    $directionAmount = array($direction[$hour] * $amountPerMinute * 0.75, $direction[$hour] * $amountPerMinute, $amountPerMinute - $amountPerMinute * (1 - $direction[$hour]) * 0.25);

                    for ($i = 0; $i < 60; $i++) {

                        // create car agents
                        for ($j = 0; $j < $amountPerMinute * (1 - $bikePercentage); $j++) {
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

                            if ($j < $directionAmount[0] * (1 - $bikePercentage)) {
                                do {
                                    $startId = $this->nodesOut[rand(0, $numOutNodes)];
                                    $endId = $this->nodesIn[rand(0, $numInNodes)];
                                } while (isset($this->unreachable["carTree"][$startId][$endId]));
                            } else if ($j < $directionAmount[1] * (1 - $bikePercentage)) {
                                do {
                                    $startId = $this->nodesIn[rand(0, $numInNodes)];
                                    $endId = $this->nodesIn[rand(0, $numInNodes)];
                                } while ($startId == $endId || isset($this->unreachable["carTree"][$startId][$endId]));
                            } else if ($j < $directionAmount[2] * (1 - $bikePercentage)) {
                                do {
                                    $startId = $this->nodesIn[rand(0, $numInNodes)];
                                    $endId = $this->nodesOut[rand(0, $numOutNodes)];
                                } while (isset($this->unreachable["carTree"][$startId][$endId]));
                            } else {
                                do {
                                    $startId = $this->nodesOut[rand(0, $numOutNodes)];
                                    $endId = $this->nodesOut[rand(0, $numOutNodes)];
                                }  while ($startId == $endId || isset($this->unreachable["carTree"][$startId][$endId]));
                            }

                            $carAgents[strval($totVehicles)] = array("start_id" => strval($startId), "end_id" => strval($endId), "length" => $length, "max_velocity" => $maxVelocity, "acceleration" => $acceleration, "deceleration" => $deceleration, "acceleration_exponent" => $accExp, "waiting_period" => $secondCounter);
                            $totVehicles++;
                        }

                        // create cyclists
                        for ($j = 0; $j < $amountPerMinute * $bikePercentage; $j++) {
                            // pseudo random length in m
                            $length = rand(3, 5) / 2;
                            // pseudo random max velocity in km/h
                            $maxVelocity = rand(10, 35);
                            // pseudo random acceleration in m/s^2
                            $acceleration = rand(50, 150) / 100;
                            // pseudo random deceleration in m/s^2
                            $deceleration = rand(100, 300) / 100;
                            // pseudo random acceleration exponent
                            $accExp = rand(80, 120) / 10;


                            if ($j < $directionAmount[0] * $bikePercentage) {
                                do {
                                    $startId = $this->nodesOut[rand(0, $numOutNodes)];
                                    $endId = $this->nodesIn[rand(0, $numInNodes)];
                                } while (isset($this->unreachable["bikeTree"][$startId][$endId]));
                            } else if ($j < $directionAmount[1] * $bikePercentage) {
                                do {
                                    $startId = $this->nodesIn[rand(0, $numInNodes)];
                                    $endId = $this->nodesIn[rand(0, $numInNodes)];
                                } while ($startId == $endId || isset($this->unreachable["bikeTree"][$startId][$endId]));
                            } else if ($j < $directionAmount[2] * $bikePercentage) {
                                do {
                                    $startId = $this->nodesIn[rand(0, $numInNodes)];
                                    $endId = $this->nodesOut[rand(0, $numOutNodes)];
                                } while (isset($this->unreachable["bikeTree"][$startId][$endId]));
                            } else {
                                do {
                                    $startId = $this->nodesOut[rand(0, $numOutNodes)];
                                    $endId = $this->nodesOut[rand(0, $numOutNodes)];
                                }  while ($startId == $endId || isset($this->unreachable["bikeTree"][$startId][$endId]));
                            }

                            $bikeAgents[strval($totVehicles)] = array("start_id" => strval($startId), "end_id" => strval($endId), "length" => $length, "max_velocity" => $maxVelocity, "acceleration" => $acceleration, "deceleration" => $deceleration, "acceleration_exponent" => $accExp, "waiting_period" => $secondCounter);
                            $totVehicles++;
                        }
                        $secondCounter += 60;
                    }
                }
                $this->writeJSON(array("bikes" => $bikeAgents, "cars" => $carAgents), $this->prefix . "_sim_" . $repetitions,  $bikePercentage * 100 . "percent_bikes");
            }
        }
    }

    /**
     * calculate how many agents we want to spawn per hour
     * @return array
     */
    private function calculateAgentAmount(): array {
        $area = round($this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon2"], $this->coordinates["lat1"]) *  $this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon1"], $this->coordinates["lat2"]));
        // assumption: at rush hour one new agent per 4000m^2 on the whole area of the map per hour
        $maxAgentAmount = $area / 4000;
        // assumption with at what hour will there be what percentage of $maxAgentAmount spawned
        // increased at morning rush hour, lunch and evening rush hour
        $agentDistribution = array(0.05, 0.05, 0.06, 0.75, 0.1, 0.25, 0.4, 0.7, 0.65, 0.6, 0.6, 0.6, 0.6, 0.6, 0.65, 0.7, 0.8, 1, 0.8, 0.5, 0.3, 0.1, 0.075, 0.05);

        foreach ($agentDistribution AS &$amount) {
            $amount = round($amount * $maxAgentAmount);
        }

        return $agentDistribution;
    }

    /**
     * write the result JSON
     * @param array $data
     * @param string $fileName
     * @param string $dir
     * @return void
     */
    private function writeJSON(array $data, string $fileName, string $dir): void {
        //create directory if needed
        if (is_dir("../data/$dir") === false) {
            mkdir("../data/$dir");
        }

        $handle = fopen("../data/$dir/$fileName.json", 'w+');

        fwrite($handle, json_encode($data));
        fclose($handle);
    }

    /**
     * reads node data from prefixMapExport.tsim and get data about unreachable nodes from /reachability/prefixReachability.json
     * @return void
     */
    private function readData(): void {
        $data = json_decode(file_get_contents("../data/" . $this->prefix . "MapExport.tsim"), true)["intersections"];

        foreach ($data AS $intersection) {
            if ($this->distance($intersection["coordinates"]["lon"], $intersection["coordinates"]["lat"], $this->center["lon"], $this->center["lat"]) > $this->radius) {
                $this->nodesOut[] = $intersection["id"];
            } else {
                $this->nodesIn[] = $intersection["id"];
            }
        }
        
        $reachabilityData = file_get_contents("../data/reachability/" . $this->prefix . "Reachability.json");
        // check if reachability file exists
        if ($reachabilityData !== false) {
            $this->unreachable = json_decode($reachabilityData, true);
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
