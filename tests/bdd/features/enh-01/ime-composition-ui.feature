@ENH-01 @EPMCDMETST-70518 @ui @ime
Feature: ENH-01 IME composition handling in the inline title editor
  While an input method editor (IME) is composing text, Enter confirms an IME candidate and Escape
  cancels the composition. Neither key may commit or discard the task edit, and the 200 character
  clamp must wait until composition ends. Composition is simulated with the DOM events a browser
  emits (compositionstart, input with isComposing, keydown with isComposing or keyCode 229,
  compositionend) because headless Chromium has no real IME.

  Background:
    Given the task list is empty
    And a task titled "Original task" exists
    And I open the task manager
    And I click Edit for "Original task"

  Scenario: Enter reported as composing does not save
    When I replace the title with "Edited while composing"
    And the browser reports an Enter key while composing
    Then the edit field is visible
    And 0 update requests were sent to the server
    And the stored current task has title "Original task"

  Scenario: Enter with legacy key code 229 does not save
    When I replace the title with "Edited while composing"
    And the browser reports an Enter key with legacy key code 229
    Then the edit field is visible
    And 0 update requests were sent to the server

  Scenario: Escape reported as composing does not cancel the edit
    When I replace the title with "Still editing"
    And the browser reports an Escape key while composing
    Then the edit field is visible
    And the edit field contains "Still editing"

  Scenario: Escape with legacy key code 229 does not cancel the edit
    When I replace the title with "Still editing"
    And the browser reports an Escape key with legacy key code 229
    Then the edit field is visible
    And the edit field contains "Still editing"

  Scenario: Enter and Escape are ignored for the whole span of a composition
    When I start an IME composition in the edit field
    And the IME composition text becomes "nihon"
    And I press "Enter" in the edit field
    Then the edit field is visible
    And 0 update requests were sent to the server
    When I press "Escape" in the edit field
    Then the edit field is visible
    And the edit field contains "nihon"

  Scenario: Enter saves again once the composition has ended
    When I start an IME composition in the edit field
    And the IME composition text becomes "nihon"
    And I commit the IME composition with "日本"
    And I press "Enter" in the edit field
    Then the edit field is not visible
    And 1 update requests were sent to the server

  Scenario: Escape cancels normally once the composition has ended
    When I start an IME composition in the edit field
    And I commit the IME composition with "Discarded"
    And I press "Escape" in the edit field
    Then the edit field is not visible
    And the task list shows "Original task"
    And 0 update requests were sent to the server

  Scenario: The 200 character clamp is deferred while composing
    When I start an IME composition in the edit field
    And the IME composition text becomes 250 copies of "CJK character"
    Then the edit field has 250 code points

  Scenario: The clamp is applied when the composition ends
    When I start an IME composition in the edit field
    And the IME composition text becomes 250 copies of "CJK character"
    And I commit the IME composition with 250 copies of "CJK character"
    Then the edit field has 200 code points

  Scenario: Clicking Cancel in the middle of a composition resets the composing flag
    When I start an IME composition in the edit field
    And I click Cancel
    And I click Edit for "Original task"
    And I replace the title with "After reset"
    And I press "Enter" in the edit field
    Then the task list shows "After reset"
    And the stored current task has title "After reset"

  Scenario: Saving with the button in the middle of a composition does not leave Enter stuck
    When I replace the title with "Saved by click"
    And I start an IME composition in the edit field
    And I click Save
    Then the task list shows "Saved by click"
    When I click Edit for "Saved by click"
    And I replace the title with "Saved by Enter"
    And I press "Enter" in the edit field
    Then the task list shows "Saved by Enter"
    And the stored current task has title "Saved by Enter"

  Scenario: A composition abandoned without a compositionend does not block the next edit session
    When I start an IME composition in the edit field
    And I click Cancel
    And I click Edit for "Original task"
    And I press "Escape" in the edit field
    Then the edit field is not visible
