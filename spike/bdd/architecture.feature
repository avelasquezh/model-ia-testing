@REQ-F1-084 @REQ-F1-085 @REQ-F1-086 @REQ-F1-087
Feature: Scenario execution through application boundaries
  As a QA engineer
  I want acceptance behavior expressed with Gherkin
  So that executable behavior remains traceable to requirements

  Scenario: Execute a valid multi-turn scenario through controlled adapters
    Given an active target and a versioned conversational scenario
    When the scenario is executed with a controlled runner
    Then the execution finishes with the runner outcome
    And the execution preserves the scenario version
    And the execution identifier is available for traceability
