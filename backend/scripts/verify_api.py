import requests
import json

BASE_URL = "http://localhost:3000/api"

def test_discovery():
    print("Testing /api/discovery...")
    try:
        response = requests.get(f"{BASE_URL}/discovery")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Keys in response: {list(data.keys())}")
        if "curated" in data:
            print(f"Curated collections found: {len(data['curated'])}")
        else:
            print("FAILED: 'curated' key missing in discovery response")
    except Exception as e:
        print(f"Error testing discovery: {e}")

if __name__ == "__main__":
    # Note: Testing admin routes require a token, which is harder via this script 
    # without hardcoding or logging in. But testing discovery is public.
    test_discovery()
