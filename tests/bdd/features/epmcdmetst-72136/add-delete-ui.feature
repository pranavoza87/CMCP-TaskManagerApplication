@EPMCDMETST-72136 @ui
Feature: Add-field length limit and delete resiliency in the UI
  ENH-16 clamps the new task field to 200 code points. ENH-13 always refreshes the list after a delete.

  Background:
    Given the task list is empty

  @ENH-16
  Scenario: The new task field accepts exactly 200 ASCII characters
    Given I open the task manager
    When I type 200 copies of "letter a" into the new task field
    Then the new task field has 200 code points

  @ENH-16
  Scenario: Pasting more than 200 characters is clamped
    Given I open the task manager
    When I paste 250 copies of "letter a" into the new task field
    Then the new task field has 200 code points

  @ENH-16
  Scenario: Typing past 200 characters is clamped
    Given I open the task manager
    When I type 205 copies of "letter a" into the new task field
    Then the new task field has 200 code points

  @ENH-16 @EPMCDMETST-72213
  Scenario: Pasting astral characters is clamped by code points
    Given I open the task manager
    When I paste 250 copies of "grinning emoji" into the new task field
    Then the new task field has 200 code points

  @ENH-16
  Scenario: A clamped title is saved with 200 code points
    Given I open the task manager
    When I paste 250 copies of "letter a" into the new task field
    And I click Add
    Then the only backend task has 200 title code points
    And the page shows no error

  @ENH-13
  Scenario: Deleting an already removed task shows the error and refreshes the list
    Given a task titled "Ghost" exists
    And I open the task manager
    And the current task is deleted behind the scenes
    When I delete "Ghost" from the list
    Then the page shows the error "task not found"
    And the task list shows no tasks

  @ENH-13
  Scenario: Only the stale row disappears when a delete hits a missing task
    Given a task titled "Keeper" exists
    And a task titled "Ghost" exists
    And I open the task manager
    And the current task is deleted behind the scenes
    When I delete "Ghost" from the list
    Then the page shows the error "task not found"
    And the task list shows exactly the titles "Keeper" in order

  @ENH-13
  Scenario: A server error on delete keeps the task listed after refresh
    Given a task titled "Stubborn" exists
    And I open the task manager
    And the server fails task deletion with an internal error
    When I delete "Stubborn" from the list
    Then the task list shows "Stubborn"
