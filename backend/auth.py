import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

# Load environment variables.
load_dotenv()

# Create the password hasher.
password_hash = PasswordHash.recommended()

# Get the JWT secret key.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set.")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# Hash a password before storing it.
def hash_password(password: str):
    return password_hash.hash(password)


# Check a password against the stored hash.
def verify_password(password: str, hashed_password: str):
    return password_hash.verify(password, hashed_password)


# Create an access token for a signed-in user.
def create_access_token(user_id: int):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": str(user_id),
        "exp": expiration,
    }

    return jwt.encode(
        token_data,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


# Verify an access token and return the user's ID.
def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        return None
