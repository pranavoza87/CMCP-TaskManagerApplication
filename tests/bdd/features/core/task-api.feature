@core @api
Feature: Task REST API (list, create, delete)
  As an API consumer
  I want to list, create and delete tasks
  So that clients can manage the task collection

  Background:
    Given the task list is empty

  Scenario: Listing an empty collection
    When I list all tasks
    Then the response status is 200
    And the response lists 0 tasks

  Scenario: Creating a task defaults the status to todo
    When I create a task titled "Buy milk"
    Then the response status is 201
    And the response task has title "Buy milk"
    And the response task has status "todo"
    And the response task has a numeric id

  Scenario: Creating a task trims the title
    When I create a task titled "  Trim me  "
    Then the response status is 201
    And the response task has title "Trim me"

  Scenario: Creating a task with an explicit status
    When I create a task titled "Already underway" with status "in_progress"
    Then the response status is 201
    And the response task has status "in_progress"

  Scenario Outline: Creating a task with each allowed status (EPMCDMETST-72162)
    When I create a task titled "Status check" with status "<status>"
    Then the response status is 201
    And the response task has status "<status>"

    Examples:
      | status      |
      | todo        |
      | in_progress |
      | done        |

  Scenario: Creating a task with an invalid status is rejected and nothing is created (EPMCDMETST-72162)
    When I create a task titled "Bad status" with status "anything"
    Then the response status is 400
    And the legacy error text is "status must be one of: todo, in_progress, done"
    When I list all tasks
    Then the response lists 0 tasks

  Scenario: Creating a task with an empty title is rejected
    When I create a task titled ""
    Then the response status is 400
    And the legacy error text is "title is required"

  Scenario: Creating a task with a whitespace-only title is rejected
    When I create a task titled "     "
    Then the response status is 400
    And the legacy error text is "title is required"

  Scenario: Creating a task with no title field is rejected
    When I create a task with no title field
    Then the response status is 400
    And the legacy error text is "title is required"

  Scenario: Tasks are listed newest first
    Given the following tasks exist in this order:
      | Alpha |
      | Beta  |
      | Gamma |
    When I list all tasks
    Then the response status is 200
    And the response lists task titles in order "Gamma,Beta,Alpha"

  Scenario: Deleting an existing task
    Given a task titled "Delete me" exists
    When I delete the current task
    Then the response status is 204
    And the response has no body
    And the backend has no task titled "Delete me"

  Scenario: Deleting an unknown task returns 404
    When I delete the task with id "987654"
    Then the response status is 404
    And the legacy error text is "task not found"
