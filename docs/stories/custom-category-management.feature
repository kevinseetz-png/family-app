# Volg CLAUDE.md pipeline voor implementatie

Feature: Volledige categorie-beheer voor agenda
  Als een gezinslid
  Wil ik zelf categorieën kunnen aanmaken en bestaande categorieën kunnen verwijderen
  Zodat ik alleen relevante categorieën zie in de agenda

  Background:
    Given ik ben ingelogd
    And ik navigeer naar instellingen

  Scenario: Nieuwe custom categorie aanmaken
    Given ik ben in het categorie-beheer scherm
    When ik op "Categorie toevoegen" tik
    And ik een naam, emoji en kleur kies
    And ik op opslaan tik
    Then verschijnt de nieuwe categorie in de lijst
    And kan ik de categorie kiezen bij het aanmaken van agenda-items

  Scenario: Standaard categorie verbergen/verwijderen
    Given ik zie de lijst met standaard categorieën (familie, werk, school, etc.)
    When ik op het verwijder-icoon tik bij een standaard categorie
    Then wordt de categorie verborgen uit de keuzelijst
    And blijven bestaande agenda-items met die categorie behouden
    And kan ik de categorie later weer terugzetten

  Scenario: Custom categorie verwijderen
    Given ik heb een custom categorie aangemaakt
    When ik op het verwijder-icoon tik bij de custom categorie
    Then wordt er een bevestiging gevraagd
    When ik bevestig
    Then wordt de categorie verwijderd
    And worden bestaande agenda-items met die categorie op "overig" gezet

  Scenario: Verborgen standaard categorie terugzetten
    Given ik heb een standaard categorie verborgen
    When ik in het categorie-beheer scherm ben
    Then zie ik een sectie "Verborgen categorieën"
    When ik op "Terugzetten" tik bij een verborgen categorie
    Then verschijnt de categorie weer in de keuzelijst

  Scenario: Minimaal één categorie moet actief zijn
    Given ik heb alle categorieën verborgen/verwijderd behalve één
    When ik probeer de laatste categorie te verwijderen
    Then zie ik een melding "Er moet minimaal één categorie actief zijn"
    And wordt de categorie niet verwijderd

  Scenario: Categorie-wijziging geldt voor heel het gezin
    Given ik verberg een standaard categorie
    Then is de categorie voor alle gezinsleden verborgen
    And zien alle gezinsleden dezelfde beschikbare categorieën
