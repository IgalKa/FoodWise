import pytest

from Server.database import Database
from Server.server import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.extensions['database'] = Database("test_database.db")
    with app.test_client() as client:
        yield client


def test_refrigerator_contents(client):
    # Make a GET request to the endpoint
    response = client.get('/refrigerator_contents?refrigerator_id=1')

    # Check if the response status code is 200 (OK)
    assert response.status_code == 200
