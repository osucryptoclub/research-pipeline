from pipeline.db import auth_headers


def test_new_style_keys_only_use_apikey_header():
    headers = auth_headers("sb_secret_example")
    assert headers == {"apikey": "sb_secret_example"}


def test_legacy_jwt_keys_also_send_bearer_token():
    headers = auth_headers("eyJhbGciOiJIUzI1NiJ9.example")
    assert headers["apikey"] == "eyJhbGciOiJIUzI1NiJ9.example"
    assert headers["Authorization"] == "Bearer eyJhbGciOiJIUzI1NiJ9.example"
