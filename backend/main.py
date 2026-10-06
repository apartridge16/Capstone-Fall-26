from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select

from auth import create_access_token, hash_password, verify_password
from database import SessionLocal, engine, test_connection
from dependencies import get_current_user
from models import Base, Program, User
from schemas import (
    AccountDelete,
    AccountUpdate,
    ProgramCreate,
    ProgramResponse,
    ProgramUpdate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

# Create the FastAPI application.
app = FastAPI()

# Create database tables that do not already exist.
Base.metadata.create_all(bind=engine)


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


# Update information for the currently signed-in user.
@app.patch("/account", response_model=UserResponse)
def update_account(
    account_data: AccountUpdate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        # Get the current user from the database.
        user = database.get(User, current_user.id)

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        # Verify the user's current password before making changes.
        if not verify_password(
            account_data.current_password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=401,
                detail="Current password is incorrect",
            )

        # Update the email if a new email was provided.
        if account_data.email is not None:
            existing_user = database.scalar(
                select(User).where(
                    User.email == account_data.email,
                    User.id != user.id,
                )
            )

            if existing_user:
                raise HTTPException(
                    status_code=409,
                    detail="Email is already registered",
                )

            user.email = account_data.email

        # Update the password if a new password was provided.
        if account_data.new_password is not None:
            if len(account_data.new_password) < 8:
                raise HTTPException(
                    status_code=400,
                    detail="New password must be at least 8 characters",
                )

            user.password_hash = hash_password(
                account_data.new_password
            )

        database.commit()
        database.refresh(user)

        return user


# Delete the currently signed-in user's account.
@app.delete("/account")
def delete_account(
    account_data: AccountDelete,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        # Get the current user from the database.
        user = database.get(User, current_user.id)

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        # Verify the user's password before deleting the account.
        if not verify_password(
            account_data.password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=401,
                detail="Password is incorrect",
            )

        # Delete the user from the database.
        database.delete(user)
        database.commit()

        return {
            "message": "Account deleted successfully"
        }


# Create a new strength progression program.
@app.post("/programs", response_model=ProgramResponse, status_code=201)
def create_program(
    program_data: ProgramCreate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        new_program = Program(
            user_id=current_user.id,
            lift=program_data.lift,
            starting_pr=program_data.starting_pr,
            goal_pr=program_data.goal_pr,
            goal_increase_percent=program_data.goal_increase_percent,
            recommended_weeks=program_data.recommended_weeks,
            selected_weeks=program_data.selected_weeks,
            initial_attainability=program_data.initial_attainability,
            current_attainability=program_data.initial_attainability,
        )

        database.add(new_program)
        database.commit()
        database.refresh(new_program)

        return new_program


# Get all programs for the currently signed-in user.
@app.get("/programs", response_model=list[ProgramResponse])
def get_programs(
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        programs = database.scalars(
            select(Program)
            .where(Program.user_id == current_user.id)
            .order_by(Program.created_at.desc())
        ).all()

        return programs


# Get one program for the currently signed-in user.
@app.get("/programs/{program_id}", response_model=ProgramResponse)
def get_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        program = database.scalar(
            select(Program).where(
                Program.id == program_id,
                Program.user_id == current_user.id,
            )
        )

        if program is None:
            raise HTTPException(
                status_code=404,
                detail="Program not found",
            )

        return program


# Update one program for the currently signed-in user.
@app.patch("/programs/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: int,
    program_data: ProgramUpdate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        # Find the program and make sure it belongs to the current user.
        program = database.scalar(
            select(Program).where(
                Program.id == program_id,
                Program.user_id == current_user.id,
            )
        )

        if program is None:
            raise HTTPException(
                status_code=404,
                detail="Program not found",
            )

        # Update the goal PR if a new goal was provided.
        if program_data.goal_pr is not None:
            if program_data.goal_pr <= program.starting_pr:
                raise HTTPException(
                    status_code=400,
                    detail="Goal PR must be greater than the starting PR",
                )

            goal_increase_percent = (
                (program_data.goal_pr - program.starting_pr)
                / program.starting_pr
            ) * 100

            # Strength AI currently supports goals between 2.5% and 25%.
            if goal_increase_percent < 2.5 or goal_increase_percent > 25:
                raise HTTPException(
                    status_code=400,
                    detail="Goal PR must be between 2.5% and 25% above the starting PR",
                )

            program.goal_pr = program_data.goal_pr
            program.goal_increase_percent = round(
                goal_increase_percent,
                1,
            )

        # Update the program length if a new length was provided.
        if program_data.selected_weeks is not None:
            allowed_weeks = [6, 8, 10, 12, 14]

            if program_data.selected_weeks not in allowed_weeks:
                raise HTTPException(
                    status_code=400,
                    detail="Program length must be 6, 8, 10, 12, or 14 weeks",
                )

            # Do not allow a program to become shorter than its current week.
            if program_data.selected_weeks < program.current_week:
                raise HTTPException(
                    status_code=400,
                    detail="Program length cannot be shorter than the current week",
                )

            program.selected_weeks = program_data.selected_weeks

        # Update the program status if a new status was provided.
        if program_data.status is not None:
            allowed_statuses = ["active", "completed"]

            if program_data.status not in allowed_statuses:
                raise HTTPException(
                    status_code=400,
                    detail="Program status must be active or completed",
                )

            program.status = program_data.status

        # Recalculate the current attainability using the updated
        # goal increase and program length.
        increase = program.goal_increase_percent

        # Base score ranges from about 95 for a 2.5% increase
        # to about 55 for a 25% increase.
        base_score = (
            95 - ((increase - 2.5) / (25 - 2.5)) * 40
        )

        # Determine the recommended program length for the goal.
        if increase <= 5:
            recommended_weeks = 6
        elif increase <= 10:
            recommended_weeks = 8
        elif increase <= 15:
            recommended_weeks = 10
        elif increase <= 20:
            recommended_weeks = 12
        else:
            recommended_weeks = 14

        # Compare the selected program length to the recommended length.
        week_difference = (
            program.selected_weeks - recommended_weeks
        )

        # Longer programs increase attainability while shorter
        # programs decrease attainability.
        if week_difference > 0:
            adjustment = (week_difference / 2) * 4
        elif week_difference < 0:
            adjustment = (week_difference / 2) * 5
        else:
            adjustment = 0

        calculated_attainability = round(
            base_score + adjustment
        )

        # Keep the score within the allowed range.
        calculated_attainability = max(
            20,
            min(99, calculated_attainability),
        )

        # Save the updated attainability separately from the
        # original attainability recorded when the program was created.
        program.current_attainability = calculated_attainability

        database.commit()
        database.refresh(program)

        return program


# Delete one program for the currently signed-in user.
@app.delete("/programs/{program_id}")
def delete_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as database:
        # Find the program and make sure it belongs to the current user.
        program = database.scalar(
            select(Program).where(
                Program.id == program_id,
                Program.user_id == current_user.id,
            )
        )

        if program is None:
            raise HTTPException(
                status_code=404,
                detail="Program not found",
            )

        # Delete the program from the database.
        database.delete(program)
        database.commit()

        return {
            "message": "Program deleted successfully"
        }
