from pydantic import BaseModel, EmailStr, Field


# Data required to create an account.
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


# Data required to sign in.
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Data returned after a successful login.


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# Data returned for a user.


class UserResponse(BaseModel):
    id: int
    email: EmailStr

    model_config = {
        "from_attributes": True
    }
