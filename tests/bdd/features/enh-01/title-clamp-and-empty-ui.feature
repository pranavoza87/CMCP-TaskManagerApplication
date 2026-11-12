@ENH-01 @EPMCDMETST-70518 @ui @title-length
Feature: ENH-01 Title length clamping and empty-title rejection in the edit field
  The UI limits a title to 200 Unicode code points (not UTF-16 code units) and the server rejects
  titles that have no visible content, including variation-selector-only titles.

  Background:
    Given the task list is empty
    And a task titled "Short title" exists
    And I open the task manager

  Scenario: Typing past 200 characters is clamped to 200
    When I click Edit for "Short title"
    And I replace the title with 250 copies of "letter a"
    Then the edit field has 200 code points

  Scenario: Exactly 200 characters are accepted unchanged
    When I click Edit for "Short title"
    And I replace the title with 200 copies of "letter a"
    Then the edit field has 200 code points
    When I press "Enter" in the edit field
    Then the saved title in the backend has 200 code points

  Scenario: A clamped title is saved with 200 characters
    When I click Edit for "Short title"
    And I replace the title with 250 copies of "letter a"
    And I click Save
    Then the edit field is not visible
    And the saved title in the backend has 200 code points

  Scenario: Emoji count as one character each, not as two UTF-16 units
    When I click Edit for "Short title"
    And I replace the title with 200 copies of "grinning emoji"
    Then the edit field has 200 code points

  Scenario: 201 emoji are clamped to 200 code points
    When I click Edit for "Short title"
    And I replace the title with 201 copies of "grinning emoji"
    Then the edit field has 200 code points

  Scenario: Emoji with a variation selector count as two characters
    When I click Edit for "Short title"
    And I replace the title with 101 copies of "red heart with variation selector"
    Then the edit field has 200 code points

  Scenario Outline: A title with no visible content is rejected by the server and editing stays open
    When I click Edit for "Short title"
    And I replace the title with a title of kind "<kind>"
    And I click Save
    Then the edit error contains "title must not be empty"
    And the edit field is visible
    And the stored current task has title "Short title"

    Examples:
      | kind                                |
      | whitespace only                     |
      | variation selector only             |
      | two variation selectors only        |
      | variation selector supplement only  |
      | zero-width space only               |
      | whitespace and invisible characters |

  Scenario: A variation selector attached to a visible character is a valid title
    When I click Edit for "Short title"
    And I replace the title with a title of kind "lone heart with variation selector"
    And I press "Enter" in the edit field
    Then the edit field is not visible
    And the stored current task has title of kind "lone heart with variation selector"

  Scenario: An empty title is rejected with a readable message
    When I click Edit for "Short title"
    And I replace the title with ""
    And I click Save
    Then the edit error contains "Invalid request: title must not be empty"
    And the edit field is focused

  Scenario: A rejected edit can be corrected and saved
    When I click Edit for "Short title"
    And I replace the title with a title of kind "variation selector only"
    And I click Save
    Then the edit error contains "title must not be empty"
    When I replace the title with "Corrected title"
    And I press "Enter" in the edit field
    Then the task list shows "Corrected title"
    And the stored current task has title "Corrected title"
