import sys
import os

# Add the root directory of your project to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from Server.server import app
from Server.models.Database import Database  # Adjust the import path

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

    response = client.get('/refrigerator_contents?refrigerator_id=2')
    # Check if the response status code is 404
    assert response.status_code == 404

    response = client.get('/refrigerator_contents')
    # Check if the response status code is 404
    assert response.status_code == 404


def test_scan(client):
    data = {"barcode": "7290004131074", "refrigerator_id": 1, "mode": "add"}
    response = client.post('/scan', json=data)
    assert response.status_code == 200

    data = {"barcode": "7290004131074", "refrigerator_id": 1, "mode": "remove"}
    response = client.post('/scan', json=data)
    assert response.status_code == 200


def test_link(client):
    data = {"user_id": 1, "refrigerator_id": 2}
    response = client.post('/link', json=data)
    assert response.status_code == 200

