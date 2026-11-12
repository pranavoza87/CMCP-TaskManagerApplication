@ENH-01 @EPMCDMETST-70519 @api
Feature: ENH-01 PATCH /api/tasks/:id status validation
  As a task owner
  I want to update a task status
  So that I can reflect its progress accurately

  Background:
    Given the task list is empty
    And a task titled "Track me" exists

  @smoke
  Scenario Outline: Each allowed status can be set
    When I patch the current task with status "<status>"
    Then the response status is 200
    And the response task is the current task
    And the response task has status "<status>"
    And the response task has title "Track me"
    And the stored current task has status "<status>"

    Examples:
      | status      |
      | todo        |
      | in_progress |
      | done        |

  Scenario Outline: Statuses outside the allowed set are rejected
    When I patch the current task with status "<status>"
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error message is "Invalid request"
    And the response error details include field "status" with issue "must be one of: todo, in_progress, done"
    And the stored current task has status "todo"

    Examples:
      | status      |
      | blocked     |
      | DONE        |
      | in-progress |
      |             |

  Scenario: A non-string status is rejected
    When I patch the current task with raw JSON:
      """
      { "status": 1 }
      """
    Then the response status is 400
    And the response error details include field "status" with issue "must be one of: todo, in_progress, done"

  Scenario: Title and status can be updated together
    When I patch the current task with title "Both changed" and status "done"
    Then the response status is 200
    And the response task has title "Both changed"
    And the response task has status "done"

  Scenario: A valid status with an invalid title changes nothing
    When I patch the current task with title "" and status "done"
    Then the response status is 400
    And the response error details include field "title" with issue "must not be empty"
    And the stored current task has status "todo"
    And the stored current task has title "Track me"

  Scenario: Invalid title and invalid status are both reported
    When I patch the current task with raw JSON:
      """
      { "title": "", "status": "nope" }
      """
    Then the response status is 400
    And the response error details include field "title" with issue "must not be empty"
    And the response error details include field "status" with issue "must be one of: todo, in_progress, done"

  Scenario: Updating only the status leaves the title untouched
    When I patch the current task with status "in_progress"
    Then the response status is 200
    And the stored current task has title "Track me"
