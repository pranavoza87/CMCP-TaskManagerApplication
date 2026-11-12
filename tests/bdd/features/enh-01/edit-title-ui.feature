@ENH-01 @EPMCDMETST-70518 @ui
Feature: ENH-01 Edit a task title inline
  As a task owner
  I want to edit a task title in place
  So that I can correct or refine what needs to be done

  Background:
    Given the task list is empty
    And a task titled "Draft proposal" exists
    And I open the task manager

  @smoke
  Scenario: Saving an edited title with the Save button
    When I click Edit for "Draft proposal"
    Then the edit field contains "Draft proposal"
    When I replace the title with "Final proposal"
    And I click Save
    Then the task list shows "Final proposal"
    And the task list does not show "Draft proposal"
    And the edit field is not visible
    And the stored current task has title "Final proposal"

  @smoke
  Scenario: Pressing Enter commits the edit
    When I click Edit for "Draft proposal"
    And I replace the title with "Proposal v2"
    And I press "Enter" in the edit field
    Then the task list shows "Proposal v2"
    And the stored current task has title "Proposal v2"

  Scenario: Pressing Escape discards the edit
    When I click Edit for "Draft proposal"
    And I replace the title with "Thrown away"
    And I press "Escape" in the edit field
    Then the task list shows "Draft proposal"
    And the edit field is not visible
    And 0 update requests were sent to the server
    And the stored current task has title "Draft proposal"

  Scenario: Clicking Cancel discards the edit
    When I click Edit for "Draft proposal"
    And I replace the title with "Thrown away"
    And I click Cancel
    Then the task list shows "Draft proposal"
    And 0 update requests were sent to the server

  Scenario: The edit field is focused when editing starts
    When I click Edit for "Draft proposal"
    Then the edit field is focused

  Scenario: Focus returns to the Edit button after saving
    When I click Edit for "Draft proposal"
    And I replace the title with "Proposal v3"
    And I press "Enter" in the edit field
    Then the Edit button for "Proposal v3" has focus

  Scenario: Focus returns to the Edit button after cancelling
    When I click Edit for "Draft proposal"
    And I press "Escape" in the edit field
    Then the Edit button for "Draft proposal" has focus

  Scenario: Saving an unchanged title sends no request
    When I click Edit for "Draft proposal"
    And I press "Enter" in the edit field
    Then the edit field is not visible
    And 0 update requests were sent to the server

  Scenario: A title that differs only by surrounding whitespace sends no request
    When I click Edit for "Draft proposal"
    And I replace the title with "   Draft proposal   "
    And I click Save
    Then the edit field is not visible
    And 0 update requests were sent to the server

  Scenario: Surrounding whitespace is trimmed on save
    When I click Edit for "Draft proposal"
    And I replace the title with "   Trimmed result   "
    And I press "Enter" in the edit field
    Then the task list shows "Trimmed result"
    And the stored current task has title "Trimmed result"

  Scenario: Editing again after a cancel starts from the stored title
    When I click Edit for "Draft proposal"
    And I replace the title with "Never saved"
    And I click Cancel
    And I click Edit for "Draft proposal"
    Then the edit field contains "Draft proposal"

  Scenario: Two quick Enter presses send a single update request
    Given the server answers task updates slowly
    When I click Edit for "Draft proposal"
    And I replace the title with "Only once"
    And I press Enter twice in quick succession in the edit field
    Then the task list shows "Only once"
    And 1 update requests were sent to the server

  Scenario: A server error is shown next to the input and editing continues
    Given the current task is deleted behind the scenes
    When I click Edit for "Draft proposal"
    And I replace the title with "Too late"
    And I click Save
    Then the edit error contains "Task not found"
    And the edit field is visible
    And the edit field contains "Too late"
