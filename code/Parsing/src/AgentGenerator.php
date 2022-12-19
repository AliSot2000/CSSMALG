<?php

class AgentGenerator
{
    private string $prefix;
    private array $coordinates;
    private array $nodes = array();
    private array $unreachable = array();
    private array $bikePercentages = array(0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2);

    /**
     * constructor
     * @param float $lon1
     * @param float $lon2
     * @param float $lat1
     * @param float $lat2
     * @param string $prefix
     */
    public function __construct(float $lon1, float $lon2, float $lat1, float $lat2, string $prefix)
    {
        $this->coordinates = array("lon1" => $lon1, "lon2" => $lon2, "lat1" => $lat1, "lat2" => $lat2);;
        $this->prefix = $prefix;
    }

    /**
     * main method of class bundling all important other methods
     * @return void
     */
    public function execute(): void
    {
        $this->readData();
        $this->generateAgents();
    }

    /**
     * generates the agents
     * @return void
     */
    private function generateAgents(): void
    {
        $agentAmount = $this->calculateAgentAmount();
        $numNodes = count($this->nodes) - 1;

        // generate agents
        foreach ($this->bikePercentages as $bikePercentage) {
            for ($repetitions = 0; $repetitions < 10; $repetitions++) {

                $carAgents = array();
                $bikeAgents = array();

                $totVehicles = 0;

                foreach ($agentAmount as $hour => $amount) {
                    $timeBase = $hour * 3600;

                    // create car agents
                    for ($i = 0; $i < $amount * (1 - $bikePercentage); $i++) {
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

                        do {
                            $startId = $this->nodes[rand(0, $numNodes)];
                            $endId = $this->nodes[rand(0, $numNodes)];
                        } while ($startId == $endId || isset($this->unreachable["carTree"][$startId][$endId]));

                        $carAgents[strval($totVehicles)] = array("start_id" => strval($startId), "end_id" => strval($endId), "length" => $length, "max_velocity" => $maxVelocity, "acceleration" => $acceleration, "deceleration" => $deceleration, "acceleration_exponent" => $accExp, "waiting_period" => $timeBase + rand(0, 35999) / 10);
                        $totVehicles++;
                    }

                    // create cyclists
                    for ($i = 0; $i < $amount * $bikePercentage; $i++) {
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


                        do {
                            $startId = $this->nodes[rand(0, $numNodes)];
                            $endId = $this->nodes[rand(0, $numNodes)];
                        } while ($startId == $endId || isset($this->unreachable["bikeTree"][$startId][$endId]));

                        $bikeAgents[strval($totVehicles)] = array("start_id" => strval($startId), "end_id" => strval($endId), "length" => $length, "max_velocity" => $maxVelocity, "acceleration" => $acceleration, "deceleration" => $deceleration, "acceleration_exponent" => $accExp, "waiting_period" => $timeBase + rand(0, 35999) / 10);
                        $totVehicles++;
                    }
                }
                $this->writeJSON(array("bikes" => $bikeAgents, "cars" => $carAgents), $this->prefix . "_sim_" . $repetitions, $bikePercentage * 100 . "percent_bikes");
            }
        }
    }

    /**
     * calculate how many agents we want to spawn per hour
     * @return array
     */
    private function calculateAgentAmount(): array
    {
        $area = round($this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon2"], $this->coordinates["lat1"]) * $this->distance($this->coordinates["lon1"], $this->coordinates["lat1"], $this->coordinates["lon1"], $this->coordinates["lat2"]));
        // assumption: one new agent per 4000m^2 on the whole area of the map per hour
        $agentAmount = $area / 4000;
        $agentDistribution = array();

        for ($i = 0; $i < 12; $i++) {
            $agentDistribution[] = $agentAmount;
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
    private function writeJSON(array $data, string $fileName, string $dir): void
    {
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
    private function readData(): void
    {
        $data = json_decode(file_get_contents("../data/" . $this->prefix . "MapExport.tsim"), true)["intersections"];

        foreach ($data as $intersection) {
            $this->nodes[] = $intersection["id"];
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
    private function distance(float $lon1, float $lat1, float $lon2, float $lat2): float
    {
        // distance based on haversine formula
        $radius = 6371e3;

        $phi1 = $lat1 * pi() / 180;
        $phi2 = $lat2 * pi() / 180;

        $deltaPhi = ($lat2 - $lat1) * pi() / 180;
        $deltaLambda = ($lon2 - $lon1) * pi() / 180;

        $a = pow(sin($deltaPhi / 2), 2) + cos($phi1) * cos($phi2) * pow(sin($deltaLambda / 2), 2);
        $b = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radius * $b;
    }
}
