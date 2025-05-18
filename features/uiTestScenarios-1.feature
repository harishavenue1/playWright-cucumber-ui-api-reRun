Feature: UI Login Tests - 1

  Scenario Outline: User logs in with different credentials
    Given I am on the login page
    When I fill in the login form with username "<username>" and password "<password>"
    Then I should see the dashboard

    Examples:
      | username | password             |
      | tomsmith | SuperSecretPassword! |
