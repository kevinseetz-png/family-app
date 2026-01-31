Feature: Push Notifications
  As a family member
  I want to receive push notifications
  So that I stay informed about feedings, vitamins, and family activity

  Background:
    Given I am a registered user in a family
    And I am logged in on a device that supports push notifications

  # --- Opt-in / Settings ---

  Scenario: Enable push notifications
    Given I have not yet enabled notifications
    When I navigate to the settings page
    And I tap "Notificaties inschakelen"
    Then the browser requests notification permission
    When I grant permission
    Then my push subscription is saved to the server
    And I see a confirmation "Notificaties ingeschakeld"

  Scenario: Disable push notifications
    Given I have push notifications enabled
    When I navigate to the settings page
    And I tap "Notificaties uitschakelen"
    Then my push subscription is removed from the server
    And I no longer receive push notifications

  Scenario: Browser denies notification permission
    Given I have not yet enabled notifications
    When I navigate to the settings page
    And I tap "Notificaties inschakelen"
    And the browser permission is denied
    Then I see a message "Notificaties geblokkeerd door je browser"
    And no subscription is saved

  # --- Feeding Reminders ---

  Scenario: Receive reminder when no feeding logged for 4 hours
    Given push notifications are enabled
    And the last feeding was logged more than 4 hours ago
    When the reminder check runs
    Then I receive a push notification with title "Voeding herinnering"
    And the body says "Het is al 4 uur geleden sinds de laatste voeding"

  Scenario: No reminder when feeding was recent
    Given push notifications are enabled
    And the last feeding was logged less than 4 hours ago
    When the reminder check runs
    Then I do not receive a feeding reminder notification

  # --- Vitamin Reminder ---

  Scenario: Receive daily vitamin D reminder
    Given push notifications are enabled
    And it is 10:00 AM
    And the vitamin D check has not been toggled today
    When the vitamin reminder check runs
    Then I receive a push notification with title "Vitamine D"
    And the body says "Vergeet de vitamine D niet!"

  Scenario: No vitamin reminder when already checked
    Given push notifications are enabled
    And the vitamin D check has already been toggled today
    When the vitamin reminder check runs
    Then I do not receive a vitamin D reminder

  # --- Family Activity ---

  Scenario: Receive notification when another family member logs a feeding
    Given push notifications are enabled
    When another family member logs a feeding of 150 ml formula
    Then I receive a push notification with title "Nieuwe voeding"
    And the body says "<name> heeft 150 ml flesvoeding gelogd"

  Scenario: Do not receive notification for my own actions
    Given push notifications are enabled
    When I log a feeding myself
    Then I do not receive a push notification about that feeding

  Scenario: Receive notification when grocery list is updated
    Given push notifications are enabled
    When another family member adds "Luiers" to the grocery list
    Then I receive a push notification with title "Boodschappenlijst"
    And the body says "<name> heeft 'Luiers' toegevoegd"

  # --- Offline / Edge Cases ---

  Scenario: Queued notifications delivered when device comes online
    Given push notifications are enabled
    And my device is offline
    When another family member logs a feeding
    And my device comes back online
    Then I receive the queued push notification

  Scenario: Notification tap opens relevant page
    Given I received a feeding reminder notification
    When I tap the notification
    Then the app opens on the feeding page
