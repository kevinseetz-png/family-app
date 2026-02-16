# Volg CLAUDE.md pipeline voor implementatie

Feature: Wekker/alarm bij taken en afspraken
  Als een gezinslid
  Wil ik optioneel een alarm kunnen instellen bij taken en afspraken
  Zodat ik op tijd herinnerd word

  Background:
    Given ik ben ingelogd
    And push-notificaties zijn ingeschakeld op mijn apparaat

  Scenario: Alarm instellen bij een nieuwe afspraak
    Given ik maak een nieuwe afspraak aan in de agenda
    When ik het alarm-veld zie
    Then staat het alarm standaard op "uit"
    When ik het alarm aanzet
    Then kan ik kiezen uit herinneringstijden:
      | optie              |
      | Op het moment zelf |
      | 5 minuten ervoor   |
      | 15 minuten ervoor  |
      | 30 minuten ervoor  |
      | 1 uur ervoor       |
      | 1 dag ervoor       |

  Scenario: Alarm instellen bij een bestaande afspraak
    Given ik heb een bestaande afspraak zonder alarm
    When ik de afspraak bewerk
    And ik een alarm instel
    Then wordt het alarm opgeslagen bij de afspraak

  Scenario: Alarm instellen bij een taak met datum
    Given ik maak een nieuwe taak aan met een datum
    When ik het alarm-veld zie
    Then kan ik optioneel een alarm instellen
    And het alarm gaat af op de ingestelde datum en tijd

  Scenario: Alarm gaat af als notificatie
    Given ik heb een afspraak met alarm ingesteld op "15 minuten ervoor"
    When het 15 minuten voor de afspraak is
    Then ontvang ik een push-notificatie met de titel van de afspraak
    And toont de notificatie de starttijd

  Scenario: Alarm bij hele-dag evenement
    Given ik heb een hele-dag afspraak met alarm "1 dag ervoor"
    When het de dag ervoor is om 09:00
    Then ontvang ik een push-notificatie als herinnering

  Scenario: Alarm verwijderen
    Given ik heb een afspraak met een alarm
    When ik de afspraak bewerk
    And ik het alarm uitzet
    Then wordt het alarm verwijderd
    And ontvang ik geen notificatie meer

  Scenario: Alarm is optioneel, niet standaard
    Given ik maak een nieuwe afspraak of taak aan
    Then staat er geen alarm ingesteld
    And hoef ik niets te doen als ik geen alarm wil
