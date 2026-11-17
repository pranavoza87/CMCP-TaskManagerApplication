@EPMCDMETST-72136 @api @ENH-17 @cors
Feature: Configurable CORS allowlist (ENH-17)

  Scenario: Without ALLOWED_ORIGINS every origin is allowed
    Given a separate API server is started with default configuration
    When I send a GET request to "/api/health" with origin "https://anywhere.example" on the separate server
    Then the response status is 200
    And the response header "access-control-allow-origin" is "https://anywhere.example"

  Scenario: Listed origins receive CORS headers
    Given a separate API server is started with environment:
      | ALLOWED_ORIGINS | https://allowed.example, https://another.example |
    When I send a GET request to "/api/health" with origin "https://another.example" on the separate server
    Then the response status is 200
    And the response header "access-control-allow-origin" is "https://another.example"

  Scenario Outline: Unlisted origins receive no CORS headers
    Given a separate API server is started with environment:
      | ALLOWED_ORIGINS | https://allowed.example, https://another.example |
    When I send a GET request to "/api/health" with origin "<origin>" on the separate server
    Then the response status is 200
    And the response has no header "access-control-allow-origin"

    Examples:
      | origin                  |
      | https://denied.example  |
      | http://allowed.example  |

  Scenario: Requests without an Origin header are always served
    Given a separate API server is started with environment:
      | ALLOWED_ORIGINS | https://allowed.example |
    When I send a GET request to "/api/health" on the separate server
    Then the response status is 200

  Scenario: Preflight from a disallowed origin gets no CORS headers
    Given a separate API server is started with environment:
      | ALLOWED_ORIGINS | https://allowed.example |
    When I send a preflight request to "/api/tasks" from origin "https://denied.example" for method "POST" on the separate server
    Then the response has no header "access-control-allow-origin"

  Scenario: Preflight from an allowed origin is answered
    Given a separate API server is started with environment:
      | ALLOWED_ORIGINS | https://allowed.example |
    When I send a preflight request to "/api/tasks" from origin "https://allowed.example" for method "POST" on the separate server
    Then the response header "access-control-allow-origin" is "https://allowed.example"
    And the response header "access-control-allow-methods" contains "POST"
