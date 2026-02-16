# Volg CLAUDE.md pipeline voor implementatie

Feature: Boodschappen tab scroll bugfix
  Als een gezinslid
  Wil ik dat de tab-navigatie bovenaan altijd zichtbaar blijft
  Zodat ik altijd kan wisselen tussen tabs, ook als de boodschappenlijst lang is

  Background:
    Given ik ben ingelogd

  Scenario: Tab-balk blijft zichtbaar bij scrollen in boodschappen
    Given ik ben op de boodschappen-tab
    And de boodschappenlijst is langer dan het scherm
    When ik naar beneden scroll
    Then blijft de tab-navigatie bovenaan het scherm zichtbaar (sticky)
    And kan ik altijd naar andere tabs wisselen

  Scenario: Tab-balk blijft zichtbaar op alle tabs
    Given ik ben op een willekeurige tab (agenda, klusjes, boodschappen, etc.)
    When de content langer is dan het scherm
    And ik naar beneden scroll
    Then blijft de tab-navigatie bovenaan het scherm zichtbaar

  Scenario: Boodschappen pagina opent met tab-balk in beeld
    Given ik navigeer naar de boodschappen-tab
    Then begint de pagina bovenaan
    And is de tab-navigatie direct zichtbaar
    And hoef ik niet omhoog te scrollen om tabs te zien

  Scenario: Content scrollt onafhankelijk van tab-balk
    Given de tab-balk is sticky bovenaan
    When ik door de boodschappenlijst scroll
    Then scrollt alleen de content onder de tab-balk
    And de tab-balk beweegt niet mee
