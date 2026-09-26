from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select

from auth import create_access_token, hash_password, verify_password
from schemas import TokenResponse, UserCreate, UserLogin, UserResponse
from database import SessionLocal, test_connection
from models import User
from dependencies import get_current_user

# Create the FastAPI application.
app = FastAPI()


# Basic endpoint to check that the backend is running.
@app.get("/")
def root():
    return {"message": "Strength AI backend is running"}


# Check the connection to our PostgreSQL database.
@app.get("/database-test")
def database_test():
    database_name = test_connection()

    return {
        "status": "connected",
        "database": database_name,
    }


# Create a new Strength AI account.
@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register_user(user_data: UserCreate):
    with SessionLocal() as database:
        # Check whether the email is already registered.
        existing_user = database.scalar(
            select(User).where(User.email == user_data.email)
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email is already registered",
            )

        # Hash the password before storing it.
        hashed_password = hash_password(user_data.password)

        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
        )

        database.add(new_user)
        database.commit()
        database.refresh(new_user)

        return new_user

# Sign in to an existing Strength AI account.


@app.post("/auth/login", response_model=TokenResponse)
def login_user(user_data: UserLogin):
    with SessionLocal() as database:
        # Find the user by email.
        user = database.scalar(
            select(User).where(User.email == user_data.email)
        )

        # Check the email and password.
        if not user or not verify_password(
            user_data.password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        # Create a token for the signed-in user.
        access_token = create_access_token(user.id)

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }


# Get information for the currently signed-in user.
@app.get("/account", response_model=UserResponse)
def get_account(
    current_user: User = Depends(get_current_user),
):
    return current_user
