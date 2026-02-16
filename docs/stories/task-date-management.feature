# Volg CLAUDE.md pipeline voor implementatie

Feature: Taken datum beheer (verplaatsen en loskoppelen)
  Als een gezinslid
  Wil ik taken kunnen verplaatsen naar een andere datum of loskoppelen van de agenda
  Zodat ik flexibel mijn planning kan aanpassen

  Background:
    Given ik ben ingelogd
    And ik heb een bestaande taak met een datum

  Scenario: Taak verplaatsen naar andere datum vanuit taken-tab
    Given ik ben op de taken-tab (klusjes)
    When ik op een taak tik met een datum
    Then zou ik een optie moeten zien om de datum te wijzigen
    When ik een nieuwe datum selecteer
    Then wordt de taak verplaatst naar de nieuwe datum
    And verschijnt de taak op de nieuwe datum in de agenda

  Scenario: Taak verplaatsen naar andere datum vanuit agenda
    Given ik ben op de agenda-pagina
    And ik zie een taak op een specifieke dag
    When ik op de taak tik
    Then zou ik een optie moeten zien om de datum te wijzigen
    When ik een nieuwe datum selecteer
    Then verdwijnt de taak van de oude dag in de agenda
    And verschijnt de taak op de nieuwe dag

  Scenario: Taak loskoppelen van agenda (datum verwijderen)
    Given ik ben op de taken-tab
    When ik op een taak tik met een datum
    Then zou ik een optie moeten zien om de datum te verwijderen
    When ik de datum verwijder
    Then verdwijnt de taak uit de agenda
    And blijft de taak zichtbaar in de taken-tab zonder datum
    And staat de taak in de "geen datum" sectie

  Scenario: Taak zonder datum koppelen aan agenda
    Given ik heb een taak zonder datum
    When ik op de taak tik in de taken-tab
    And ik een datum toewijs
    Then verschijnt de taak in de agenda op die datum

  Scenario: Datum wijzigen behoudt andere taak-eigenschappen
    Given ik heb een taak met prioriteit, status en recurrence
    When ik de datum wijzig
    Then blijven prioriteit, status en recurrence ongewijzigd
    And wordt alleen de datum aangepast
