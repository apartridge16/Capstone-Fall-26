from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth import decode_access_token
from database import SessionLocal
from models import User

# Read Bearer tokens from the Authorization header.
security = HTTPBearer()


# Get the currently signed-in user.
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    # Verify the token and get the user's ID.
    user_id = decode_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    # Find the user in PostgreSQL.
    with SessionLocal() as database:
        user = database.get(User, user_id)

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

        # Detach the object before the database session closes.
        database.expunge(user)

        return user
