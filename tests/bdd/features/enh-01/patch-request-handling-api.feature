@ENH-01 @EPMCDMETST-70518 @EPMCDMETST-70519 @api
Feature: ENH-01 PATCH /api/tasks/:id request handling and error contract
  Covers body shape, id handling, validation order and the error envelope.

  Background:
    Given the task list is empty
    And a task titled "Subject" exists

  Scenario: An empty body is rejected
    When I patch the current task with raw JSON:
      """
      {}
      """
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error details include field "body" with issue "must include at least one of: title, status"

  Scenario: An unknown field is rejected
    When I patch the current task with raw JSON:
      """
      { "title": "Fine", "priority": "high" }
      """
    Then the response status is 400
    And the response error details include field "priority" with issue "unknown field"
    And the stored current task has title "Subject"

  Scenario: A JSON array body is rejected
    When I patch the current task with raw JSON:
      """
      []
      """
    Then the response status is 400
    And the response error details include field "body" with issue "must be a JSON object"

  Scenario: Malformed JSON is rejected
    When I patch the current task with raw JSON:
      """
      { "title": "unterminated
      """
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error details include field "body" with issue "must be valid JSON"

  Scenario: A body over 100 KB is rejected with 413
    When I patch the current task with an oversized body of about 120 KB
    Then the response status is 413
    And the response error code is "PAYLOAD_TOO_LARGE"
    And the stored current task has title "Subject"

  Scenario: An unsupported content encoding is normalised to a 400
    When I patch the current task with content encoding "x-unknown" and raw JSON:
      """
      { "title": "Encoded" }
      """
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error details include field "body" with issue "could not be read"

  Scenario: An unknown task id returns 404
    When I patch task id "987654" with raw JSON:
      """
      { "title": "Nobody home" }
      """
    Then the response status is 404
    And the response error code is "NOT_FOUND"
    And the response error message is "Task not found"

  Scenario Outline: Ids that are not canonical positive integers return 404
    When I patch task id "<id>" with raw JSON:
      """
      { "title": "Whatever" }
      """
    Then the response status is 404
    And the response error code is "NOT_FOUND"
    And the stored current task has title "Subject"

    Examples:
      | id                      |
      | 1.5                     |
      | 0                       |
      | -1                      |
      | 007                     |
      | 1e3                     |
      | abc                     |
      | %201                    |
      | 99999999999999999999999 |

  Scenario: Validation runs before the lookup, so a bad body on an unknown id is a 400
    When I patch task id "987654" with raw JSON:
      """
      { "status": "bogus" }
      """
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"

  Scenario: Patching a task that was deleted returns 404
    Given the current task is deleted behind the scenes
    When I patch the current task with title "Too late"
    Then the response status is 404
    And the response error code is "NOT_FOUND"

  Scenario: Only the targeted task is changed
    Given a task titled "Bystander" exists
    And a task titled "Target" exists
    When I patch the current task with title "Target renamed"
    Then the response status is 200
    When I list all tasks
    Then the response lists task titles in order "Target renamed,Bystander,Subject"
