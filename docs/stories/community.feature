# NB: Volg CLAUDE.md pipeline voor implementatie

Feature: Community Tab
  As a family app user
  I want to share posts with the community
  So that families can communicate across family boundaries

  Scenario: View community posts
    Given I am logged in
    When I visit /community
    Then I should see the most recent community posts from all families

  Scenario: Create a community post
    Given I am logged in
    When I write a message and click "Plaatsen"
    Then my post should appear in the community feed
    And it should show my name and family name

  Scenario: Community posts are cross-family
    Given users from different families have posted
    When any user visits /community
    Then they should see posts from all families

  Scenario: Community tab appears in navigation
    Given I am logged in
    Then I should see "Community" in the tab bar
