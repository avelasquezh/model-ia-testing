Feature: Architecture vertical slice
  As an architect
  I want the execution flow to cross defined boundaries
  So that the MVP remains testable and auditable

  Scenario: Execute a scenario through application ports
    Given a valid scenario with one conversational step
    When the scenario is executed with controlled adapters
    Then a run identifier is returned
    And evidence is correlated with that run
