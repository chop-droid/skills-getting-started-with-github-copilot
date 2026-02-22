import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module

# capture a deep copy of the original activities mapping so we can
# restore it between tests.
_original_activities = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before each test."""
    # Arrange: clear and repopulate from the original snapshot
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_original_activities))


@pytest.fixture

def client():
    """Return a TestClient bound to the FastAPI app."""
    return TestClient(app_module.app)


def test_root_redirect(client):
    # Arrange: nothing special needed

    # Act - don't follow the redirect so we can inspect the response
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code in (307, 302)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    # Arrange: baseline activities present

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == _original_activities


def test_signup_success(client):
    # Arrange
    activity = "Chess Club"
    email = "new@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]


def test_signup_nonexistent(client):
    # Arrange
    activity = "Nonexistent"
    email = "test@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"


def test_signup_already_signed_up(client):
    # Arrange
    activity = "Chess Club"
    existing = _original_activities[activity]["participants"][0]

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": existing})

    # Assert
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Student already signed up for this activity"


def test_state_reset_between_tests(client):
    # Arrange: mutate state
    activity = "Chess Club"
    app_module.activities[activity]["participants"].append("temp@mergington.edu")

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    # ensure the mutation from the arrange step is visible initially
    assert "temp@mergington.edu" in response.json()[activity]["participants"]

    # After the test completes, the autouse fixture should reset the state for the next test.
