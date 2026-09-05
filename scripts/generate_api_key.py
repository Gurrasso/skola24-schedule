import hashlib
import os
import secrets
from pathlib import Path

# The KEY_FILE can be changed through an env variable
KEY_FILE = Path(
    os.getenv(
        "SKOLA24_KEY_FILE",
        Path(__file__).resolve().parent.parent / "secrets" / "api_key_hash",
    )
)


def generate_api_key():
    api_key = secrets.token_urlsafe(32)
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEY_FILE.write_text(api_key_hash + "\n")
    KEY_FILE.chmod(0o600)

    print("API key generated:")
    print()
    print(api_key)
    print()
    print("Store this key securely. It cannot be recovered from the server.")


if __name__ == "__main__":
    generate_api_key()
