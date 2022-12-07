<?php
include_once("Parser.php");
include_once("AgentGenerator.php");
// small coords: 8.50, 8.55, 47.36, 47.41
// big coords: 8.50, 8.56, 47.35, 47.43
// create and run Parser
$parser = new Parser(8.50, 8.55, 47.36, 47.41);
$parser->execute();

// create and run AgentGenerator
$agentGen = new AgentGenerator(8.50, 8.55, 47.36, 47.41);
$agentGen->execute();
?>
