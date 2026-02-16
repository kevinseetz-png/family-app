# Volg CLAUDE.md pipeline voor implementatie

Feature: Taak met einddatum / aantal weken
  Als een gezinslid
  Wil ik een taak kunnen laten lopen voor een bepaald aantal weken of tot een einddatum
  Zodat terugkerende taken automatisch stoppen wanneer nodig

  Background:
    Given ik ben ingelogd

  Scenario: Terugkerende taak met einddatum aanmaken
    Given ik maak een nieuwe terugkerende taak aan (dagelijks/wekelijks/maandelijks)
    When ik het "Loopt tot" veld zie
    Then kan ik een einddatum kiezen
    When ik een einddatum selecteer en opsla
    Then wordt de taak herhaald tot en met de einddatum
    And na de einddatum verschijnt de taak niet meer

  Scenario: Terugkerende taak voor X weken laten lopen
    Given ik maak een nieuwe terugkerende taak aan
    When ik kies voor "Aantal weken"
    And ik vul "4" in
    Then wordt de einddatum automatisch berekend als 4 weken na de startdatum
    And wordt dit getoond als einddatum

  Scenario: Einddatum alleen bij terugkerende taken
    Given ik maak een eenmalige taak aan (recurrence = none)
    Then zie ik geen "Loopt tot" of "Aantal weken" optie

  Scenario: Bestaande terugkerende taak einddatum geven
    Given ik heb een bestaande terugkerende taak zonder einddatum
    When ik de taak bewerk
    And ik een einddatum toevoeg
    Then stopt de herhaling na de einddatum

  Scenario: Einddatum verwijderen van terugkerende taak
    Given ik heb een terugkerende taak met einddatum
    When ik de taak bewerk
    And ik de einddatum verwijder
    Then loopt de taak weer onbeperkt door

  Scenario: Week-weergave toont taken alleen tot einddatum
    Given ik heb een wekelijkse taak die loopt tot volgende week
    When ik de week-weergave bekijk voor de week erna
    Then zie ik de taak niet meer
    And de taak verschijnt ook niet in de agenda na de einddatum

  Scenario: Einddatum in het verleden maakt taak inactief
    Given ik heb een terugkerende taak waarvan de einddatum verstreken is
    Then verschijnt de taak niet meer in de dagweergave
    And blijft de taak zichtbaar in de taken-lijst als "verlopen"
