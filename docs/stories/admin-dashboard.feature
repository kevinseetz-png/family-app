# NB: Volg CLAUDE.md pipeline voor implementatie

Feature: Admin Dashboard
  As an admin user
  I want to manage families and users
  So that I can organize the app's user base

  Scenario: Admin can view all families
    Given I am logged in as an admin
    When I visit /admin
    Then I should see a list of all families with member counts

  Scenario: Admin can view all users
    Given I am logged in as an admin
    When I visit /admin
    Then I should see a table of all users with name, email, family, and role

  Scenario: Admin can move a user to another family
    Given I am logged in as an admin
    And there are multiple families
    When I select a target family for a user and confirm
    Then the user's family should be updated

  Scenario: Admin can delete a user
    Given I am logged in as an admin
    When I click delete on a user and confirm
    Then the user should be removed from the system

  Scenario: Admin cannot delete themselves
    Given I am logged in as an admin
    When I try to delete my own account
    Then the action should be rejected

  Scenario: Non-admin users are blocked
    Given I am logged in as a member
    When I try to access /api/admin/users
    Then I should receive a 403 Forbidden response

  Scenario: Admin link visible on settings page
    Given I am logged in as an admin
    When I visit /instellingen
    Then I should see a link to "Beheerder dashboard"
