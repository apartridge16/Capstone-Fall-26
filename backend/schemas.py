from datetime import datetime

from pydantic import BaseModel, EmailStr


# Data required to create a new user account.
class UserCreate(BaseModel):
    email: EmailStr
    password: str


# Data required to log in.
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# User information that is safe to return to the frontend.
# The password hash is intentionally not included.
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# Response returned after a successful login.
class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# Data used when updating account information.
# Email and new_password are optional because the user may
# update either one without changing the other.
class AccountUpdate(BaseModel):
    current_password: str
    email: EmailStr | None = None
    new_password: str | None = None


# Current password is required before an account can be deleted.
class AccountDelete(BaseModel):
    password: str


# Data required to create a new strength progression program.
class ProgramCreate(BaseModel):
    lift: str
    starting_pr: float
    goal_pr: float
    goal_increase_percent: float
    recommended_weeks: int
    selected_weeks: int
    initial_attainability: int


# Data that can be changed after a program has been created.
# Starting PR and current week are intentionally not editable here.
class ProgramUpdate(BaseModel):
    goal_pr: float | None = None
    selected_weeks: int | None = None
    status: str | None = None


# Program information returned to the frontend.
class ProgramResponse(BaseModel):
    id: int
    user_id: int
    lift: str
    starting_pr: float
    goal_pr: float
    goal_increase_percent: float
    recommended_weeks: int
    selected_weeks: int
    current_week: int
    initial_attainability: int
    current_attainability: int
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
