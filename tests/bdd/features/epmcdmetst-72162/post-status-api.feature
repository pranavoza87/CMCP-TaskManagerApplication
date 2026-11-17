@EPMCDMETST-72162 @api @post-status
Feature: POST /api/tasks status validation
  POST applies the same allowlist as PATCH: todo, in_progress, done. A missing or falsy status
  defaults to todo; anything else is rejected with 400 and nothing is created.

  Background:
    Given the task list is empty

  Scenario Outline: Falsy status values default to todo
    When I create a task titled "Falsy" with the JSON status value <value>
    Then the response status is 201
    And the response task has status "todo"

    Examples:
      | value |
      | null  |
      | ""    |
      | 0     |
      | false |

  Scenario Outline: Invalid status values are rejected and nothing is created
    When I create a task titled "Invalid" with the JSON status value <value>
    Then the response status is 400
    And the legacy error text is "status must be one of: todo, in_progress, done"
    And the backend holds 0 tasks

    Examples:
      | value         |
      | "anything"    |
      | "DONE"        |
      | "Todo"        |
      | " done"       |
      | "in-progress" |
      | 1             |
      | true          |
      | ["done"]      |
      | {"a":"done"}  |

  Scenario: An invalid status does not leak into a valid follow-up creation
    When I create a task titled "Rejected" with status "bogus"
    Then the response status is 400
    When I create a task titled "Accepted" with status "done"
    Then the response status is 201
    And the stored current task has status "done"
    And the backend holds 1 tasks

  Scenario: Title validation takes precedence over status validation
    When I create a task titled "" with status "bogus"
    Then the response status is 400
    And the legacy error text is "title is required"

  Scenario: A created task can be moved to another allowed status with PATCH
    When I create a task titled "Moves" with status "in_progress"
    And I patch the current task with status "done"
    Then the response status is 200
    And the response task has status "done"

  Scenario: Existing rows are untouched after a rejected creation
    Given a task titled "Existing" with status "done" exists
    When I create a task titled "New" with status "bogus"
    Then the response status is 400
    When I list all tasks
    Then the response lists 1 tasks
