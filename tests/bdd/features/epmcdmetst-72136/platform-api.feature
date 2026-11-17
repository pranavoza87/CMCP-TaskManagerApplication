@EPMCDMETST-72136 @api @platform
Feature: Task Manager platform enhancements (health, error handling, title length, CORS, logging)
  ENH-14 health endpoint, ENH-15 request logging and centralized error handling,
  ENH-16 server-side title length limit, ENH-17 configurable CORS allowlist.

  Background:
    Given the task list is empty

  @ENH-14 @smoke
  Scenario: Health endpoint reports ok
    When I send a GET request to "/api/health"
    Then the response status is 200
    And the response JSON is:
      """
      { "status": "ok" }
      """

  @ENH-14
  Scenario: Health endpoint leaves the task collection alone
    Given a task titled "Untouched" exists
    When I send a GET request to "/api/health"
    Then the response status is 200
    And the backend holds 1 tasks

  @ENH-16
  Scenario Outline: POST accepts titles up to 200 code points
    When I create a task whose title is <count> copies of "<glyph>"
    Then the response status is 201
    And the response task has <count> title code points

    Examples:
      | count | glyph          |
      | 1     | letter a       |
      | 199   | letter a       |
      | 200   | letter a       |
      | 200   | grinning emoji |
      | 200   | CJK character  |

  @ENH-16
  Scenario Outline: POST rejects titles over 200 code points
    When I create a task whose title is <count> copies of "<glyph>"
    Then the response status is 400
    And the legacy error text is "title must be at most 200 characters"
    And the backend holds 0 tasks

    Examples:
      | count | glyph          |
      | 201   | letter a       |
      | 500   | letter a       |
      | 201   | grinning emoji |

  @ENH-16
  Scenario: Surrounding whitespace does not count towards the limit
    When I create a task whose title is 200 copies of "letter a" surrounded by spaces
    Then the response status is 201
    And the response task has 200 title code points

  @ENH-16
  Scenario: The title limit is configurable through TITLE_MAX_LENGTH
    Given a separate API server is started with environment:
      | TITLE_MAX_LENGTH | 10 |
    When I create a task whose title is 10 copies of "letter a" on the separate server
    Then the response status is 201
    When I create a task whose title is 11 copies of "letter a" on the separate server
    Then the response status is 400
    And the legacy error text is "title must be at most 10 characters"
    And the backend holds 1 tasks on the separate server

  @ENH-16
  Scenario Outline: An invalid TITLE_MAX_LENGTH disables the limit
    Given a separate API server is started with environment:
      | TITLE_MAX_LENGTH | <value> |
    When I create a task whose title is 250 copies of "letter a" on the separate server
    Then the response status is 201

    Examples:
      | value |
      | abc   |
      | 0     |
      | -5    |

  @ENH-16
  Scenario: An empty title is still reported as required
    When I create a task titled "   "
    Then the response status is 400
    And the legacy error text is "title is required"

  @ENH-15
  Scenario: Malformed JSON on POST returns a generic 400
    When I post raw JSON to the tasks endpoint:
      """
      { "title": "broken
      """
    Then the response status is 400
    And the response JSON is:
      """
      { "error": "invalid JSON body" }
      """

  @ENH-15
  Scenario: An oversized POST body returns 413
    When I post an oversized body of about 200 KB to the tasks endpoint
    Then the response status is 413
    And the response JSON is:
      """
      { "error": "request body is too large" }
      """

  @ENH-15
  Scenario: An unsupported content encoding on POST returns 415
    When I post to the tasks endpoint with content encoding "unknown" and raw JSON:
      """
      { "title": "x" }
      """
    Then the response status is 415
    And the response JSON is:
      """
      { "error": "unsupported media type" }
      """

  @ENH-15
  Scenario: PATCH keeps its strict error envelope
    Given a task titled "Keep envelope" exists
    When I patch the current task with raw JSON:
      """
      { "title": "broken
      """
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"

  @ENH-15
  Scenario: Requests are logged with method, url, status and duration
    Given a separate API server is started with default configuration
    When I send a GET request to "/api/health" on the separate server
    And I create a task titled "Logged" on the separate server
    Then the separate server log has a "GET" entry for "/api/health" with status 200
    And the separate server log has a "POST" entry for "/api/tasks" with status 201

  @ENH-15
  Scenario: Rejected requests are logged with their error status
    Given a separate API server is started with default configuration
    When I create a task whose title is 201 copies of "letter a" on the separate server
    Then the separate server log has a "POST" entry for "/api/tasks" with status 400
