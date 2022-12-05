<?php
include_once("Parser.php");
include_once("AgentGenerator.php");

// create and run Parser
$parser = new Parser(8.50, 8.56, 47.35, 47.43);
$parser->execute();

// create and run AgentGenerator
$agentGen = new AgentGenerator(8.50, 8.56, 47.35, 47.43);
$agentGen->execute();
?>
