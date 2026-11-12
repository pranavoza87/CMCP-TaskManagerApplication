@core @ui
Feature: Task list management in the browser
  As a task owner
  I want to view, add and delete tasks
  So that I can keep track of what needs to be done

  Background:
    Given the task list is empty

  @smoke
  Scenario: An empty list shows the empty-state message
    Given I open the task manager
    Then the task list shows no tasks

  @smoke
  Scenario: Adding a task with the Add button shows it in the list
    Given I open the task manager
    When I add a task titled "Write quarterly report"
    Then the task list shows "Write quarterly report"
    And the new task field is empty

  Scenario: Adding a task by pressing Enter in the new task field
    Given I open the task manager
    When I add a task titled "Book flights" by pressing Enter
    Then the task list shows "Book flights"

  Scenario: A blank title is not added
    Given I open the task manager
    When I add a task titled "     "
    Then the task list shows no tasks

  Scenario: Surrounding whitespace is trimmed when a task is added
    Given I open the task manager
    When I add a task titled "   Padded title   "
    Then the task list shows "Padded title"

  Scenario: Newest tasks are listed first
    Given the following tasks exist in this order:
      | First  |
      | Second |
      | Third  |
    When I open the task manager
    Then the task list shows exactly the titles "Third,Second,First" in order

  Scenario: Existing tasks are loaded with their status
    Given a task titled "Already there" with status "in_progress" exists
    When I open the task manager
    Then the task list shows "Already there"

  @smoke
  Scenario: Deleting a task removes it from the list
    Given a task titled "Disposable" exists
    And a task titled "Keeper" exists
    And I open the task manager
    When I delete "Disposable" from the list
    Then the task list does not show "Disposable"
    And the task list shows "Keeper"
    And the backend has no task titled "Disposable"

  Scenario: Deleting the last task shows the empty-state message
    Given a task titled "Only one" exists
    And I open the task manager
    When I delete "Only one" from the list
    Then the task list shows no tasks

  Scenario: Deleting a task that was already removed elsewhere shows an error
    Given a task titled "Ghost" exists
    And I open the task manager
    And the current task is deleted behind the scenes
    When I delete "Ghost" from the list
    Then the page shows the error "task not found"
