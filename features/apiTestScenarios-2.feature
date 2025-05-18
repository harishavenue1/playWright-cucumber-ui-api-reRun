Feature: API Tests - 2

  Scenario Outline: API GET request returns expected status
    When I send a GET request to "<endpoint>"
    Then the response status should be <status>

    Examples:
      | endpoint          | status |
      | /posts/1/comments |    200 |
      | /albums           |    201 |
      | /invalid-endpoint |    404 |
