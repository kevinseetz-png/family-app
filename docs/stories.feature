Feature: PWA Installation
  As a family member
  I want to install the app on my phone or desktop
  So that I can access it like a native app

  Scenario: App is installable on mobile browser
    Given I open the app URL on my phone's browser
    When the page has fully loaded
    Then I should see an "Add to Home Screen" prompt
    And the app should have a valid web manifest
    And the app should have a service worker registered

  Scenario: App works offline after install
    Given I have installed the app on my phone
    When I lose internet connection
    Then I should see a cached version of the app
    And I should see a message that I am offline

  Scenario: App displays in standalone mode
    Given I have installed the app on my phone
    When I open the app from my home screen
    Then it should open without browser UI
    And the status bar should match the app theme color

Feature: Authentication
  As a family member
  I want to log in to the family app
  So that only my family can access it

  Scenario: View login page when not authenticated
    Given I am not logged in
    When I open the app
    Then I should be redirected to the login page
    And I should see an email input field
    And I should see a password input field
    And I should see a "Log in" button

  Scenario: Successful login
    Given I am on the login page
    When I enter a valid email address
    And I enter a valid password
    And I click the "Log in" button
    Then I should be redirected to the home page
    And I should see a welcome message with my name

  Scenario: Failed login with wrong credentials
    Given I am on the login page
    When I enter an invalid email or password
    And I click the "Log in" button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  Scenario: Registration is invite-only
    Given I am on the login page
    When I click "Create account"
    Then I should see a message "You need an invite code to join"
    And I should see an invite code input field
    And I should see fields for name, email, and password

  Scenario: Register with a valid invite code
    Given I am on the registration page
    And I have a valid invite code from a family member
    When I enter the invite code
    And I fill in my name, email, and password
    And I click "Sign up"
    Then my account should be created
    And the invite code should be marked as used
    And I should be redirected to the home page

  Scenario: Register with an invalid or expired invite code
    Given I am on the registration page
    When I enter an invalid or already-used invite code
    And I fill in my name, email, and password
    And I click "Sign up"
    Then I should see an error message "Invalid or expired invite code"
    And no account should be created

  Scenario: Register without an invite code
    Given I am on the registration page
    When I leave the invite code field empty
    And I fill in my name, email, and password
    And I click "Sign up"
    Then I should see a validation error on the invite code field
    And no account should be created

  Scenario: Family member generates an invite code
    Given I am logged in
    When I navigate to the "Invite" page
    And I click "Generate invite code"
    Then I should see a unique invite code
    And I should be able to copy or share it

  Scenario: Invite code is single-use
    Given a family member has generated an invite code
    And another person has already used that code to register
    When I try to register with the same code
    Then I should see an error message "Invalid or expired invite code"

  Scenario: Pipeline enforcement for invite-only feature
    # This is a LARGE task (auth, data model, multi-file)
    # Pipeline stages: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
    # Per CLAUDE.md, all stages must be followed
    Given the developer begins the invite-only feature
    Then the Test Writer agent must write failing tests first
    And the Implementer agent writes minimum code to pass tests
    And reviewers (Performance, Security, Code Quality, Accessibility, Type Safety) report only
    And the Feedback Processor applies fixes from reviewers
    And the Final Tester runs all checks and produces a verdict
    And all output is appended to docs/pipeline-handoff.md

  Scenario: Stay logged in across sessions
    Given I am logged in
    When I close the app
    And I reopen the app later
    Then I should still be logged in
    And I should see the home page directly

  Scenario: Log out
    Given I am logged in
    When I click the "Log out" button
    Then I should be redirected to the login page
    And my session should be cleared

  Scenario: Protected routes
    Given I am not logged in
    When I try to access any page other than login
    Then I should be redirected to the login page
