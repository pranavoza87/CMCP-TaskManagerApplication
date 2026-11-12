@ENH-01 @EPMCDMETST-70518 @api @title-length
Feature: ENH-01 PATCH /api/tasks/:id title validation
  The title is trimmed, must have visible content, must not contain control characters and is limited
  to 200 Unicode code points.

  Background:
    Given the task list is empty
    And a task titled "Original" exists

  @smoke
  Scenario: A valid title is updated and returned
    When I patch the current task with title "Renamed"
    Then the response status is 200
    And the response task is the current task
    And the response task has title "Renamed"
    And the response task has status "todo"
    And the stored current task has title "Renamed"

  Scenario: Surrounding whitespace is trimmed
    When I patch the current task with title "   padded   "
    Then the response status is 200
    And the response task has title "padded"

  Scenario: Leading and trailing newlines are trimmed
    When I patch the current task with a title of kind "leading and trailing newlines"
    Then the response status is 200
    And the response task has title "Trimmed me"

  Scenario: Exactly 200 characters are accepted
    When I patch the current task with a title made of 200 copies of "letter a"
    Then the response status is 200
    And the response task has 200 title code points

  Scenario: 201 characters are rejected
    When I patch the current task with a title made of 201 copies of "letter a"
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error details include field "title" with issue "must be at most 200 characters"
    And the stored current task has title "Original"

  Scenario: Length is counted in code points, so 200 emoji are accepted
    When I patch the current task with a title made of 200 copies of "grinning emoji"
    Then the response status is 200
    And the response task has 200 title code points

  Scenario: 201 emoji are rejected
    When I patch the current task with a title made of 201 copies of "grinning emoji"
    Then the response status is 400
    And the response error details include field "title" with issue "must be at most 200 characters"

  Scenario: Emoji with a variation selector count as two code points (100 hearts fit)
    When I patch the current task with a title made of 100 copies of "red heart with variation selector"
    Then the response status is 200
    And the response task has 200 title code points

  Scenario: Emoji with a variation selector count as two code points (101 hearts do not fit)
    When I patch the current task with a title made of 101 copies of "red heart with variation selector"
    Then the response status is 400
    And the response error details include field "title" with issue "must be at most 200 characters"

  Scenario Outline: Titles with no visible content are rejected as empty
    When I patch the current task with a title of kind "<kind>"
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error details include field "title" with issue "must not be empty"
    And the stored current task has title "Original"

    Examples:
      | kind                                |
      | whitespace only                     |
      | zero-width space only               |
      | zero-width joiner only              |
      | word joiner only                    |
      | byte order mark only                |
      | variation selector only             |
      | two variation selectors only        |
      | variation selector supplement only  |
      | whitespace and invisible characters |
      | NUL only                            |

  Scenario: An empty string is rejected
    When I patch the current task with title ""
    Then the response status is 400
    And the response error details include field "title" with issue "must not be empty"

  Scenario Outline: Control characters inside a title are rejected
    When I patch the current task with a title of kind "<kind>"
    Then the response status is 400
    And the response error details include field "title" with issue "must not contain control characters"
    And the stored current task has title "Original"

    Examples:
      | kind               |
      | newline inside     |
      | tab inside         |
      | NUL at start       |
      | BEL at end         |
      | DEL at end         |
      | NEL at start       |
      | C1 control inside  |

  Scenario Outline: Joiners and variation selectors attached to visible text are kept
    When I patch the current task with a title of kind "<kind>"
    Then the response status is 200
    And the response task has title of kind "<kind>"
    And the stored current task has title of kind "<kind>"

    Examples:
      | kind                               |
      | heart with variation selector      |
      | lone heart with variation selector |
      | family emoji with joiners          |
      | zero-width non-joiner inside       |

  Scenario: A non-string title is rejected
    When I patch the current task with raw JSON:
      """
      { "title": 12345 }
      """
    Then the response status is 400
    And the response error details include field "title" with issue "must be a string"

  Scenario: A null title is rejected
    When I patch the current task with raw JSON:
      """
      { "title": null }
      """
    Then the response status is 400
    And the response error details include field "title" with issue "must be a string"
