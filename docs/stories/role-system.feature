# NB: Volg CLAUDE.md pipeline voor implementatie

Feature: Role System
  As the app owner
  I want a role-based system (admin/member)
  So that I can control who has administrative access

  Scenario: First registered user becomes admin
    Given no users exist in the system
    When I register a new account
    Then my role should be "admin"

  Scenario: Subsequent users become members
    Given at least one user exists
    When a new user registers with a valid invite code
    Then their role should be "member"

  Scenario: Role persists in JWT token
    Given I am logged in as an admin
    When my token is verified
    Then the decoded user should have role "admin"

  Scenario: Legacy users default to member
    Given a user exists without a role field in the database
    When that user logs in
    Then their role should default to "member"
