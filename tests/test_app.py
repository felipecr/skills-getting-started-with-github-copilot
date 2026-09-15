from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_unregister_participant_removes_email_from_activity():
    activity_name = "Chess Club"
    email = "tempstudent@example.com"

    signup_response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert signup_response.status_code == 200

    unregister_response = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert unregister_response.status_code == 200
    assert unregister_response.json()["message"] == f"Removed {email} from {activity_name}"

    activities = client.get("/activities").json()
    assert email not in activities[activity_name]["participants"]


def test_signup_rejects_duplicate_registration_for_same_activity():
    activity_name = "Soccer Club"
    email = "duplicate@example.com"

    first = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert first.status_code == 200

    second = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert second.status_code == 400
    assert second.json()["detail"] == "Student already signed up for this activity"

    client.delete(f"/activities/{activity_name}/unregister?email={email}")


def test_signup_rejects_invalid_activity_name():
    response = client.post("/activities/Unknown Activity/signup?email=test@example.com")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_rejects_when_activity_is_full():
    activity_name = "Chess Club"
    email = "newstudent@example.com"

    activity = client.get("/activities").json()[activity_name]
    max_participants = activity["max_participants"]
    current_participants = activity["participants"][:]

    for index in range(len(current_participants), max_participants):
        email_to_add = f"student{index}@example.com"
        response = client.post(f"/activities/{activity_name}/signup?email={email_to_add}")
        if response.status_code == 200:
            continue
        if response.status_code == 400 and response.json()["detail"] == "Activity is full":
            break

    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_unregister_rejects_student_not_registered():
    activity_name = "Art Club"
    email = "notregistered@example.com"

    response = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not registered for this activity"
