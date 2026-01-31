# NB: Volg CLAUDE.md pipeline voor implementatie

Feature: Tab Preferences
  As a user
  I want to choose which tabs are visible in my navigation
  So that I can customize my app experience

  Scenario: All tabs visible by default
    Given I am a new user with no preferences set
    When I view the tab bar
    Then all tabs should be visible (Eten, Noties, Menu, Boodschapje, Community)

  Scenario: Toggle a tab off
    Given I am on /instellingen
    When I toggle off "Noties"
    Then "Noties" should disappear from the tab bar
    And the preference should be saved

  Scenario: Toggle a tab on
    Given I previously toggled off "Noties"
    When I toggle "Noties" back on
    Then "Noties" should reappear in the tab bar

  Scenario: Settings tab always visible
    Given I have toggled off all toggleable tabs
    When I view the tab bar
    Then the settings tab (⚙️) should still be visible

  Scenario: Preferences persist across sessions
    Given I have customized my visible tabs
    When I log out and log back in
    Then my tab preferences should be restored
