Feature: API Tests - 1

  Scenario Outline: API GET request returns expected status
    When I send a GET request to "<endpoint>"
    Then the response status should be <status>

    Examples:
      | endpoint | status |
      | /posts/1 |    200 |
      | /posts   |    200 |
      | /users/1 |    200 |
