import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables from the .env file.
load_dotenv()

# Get the PostgreSQL connection string.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set.")

# Create the database connection engine.
engine = create_engine(DATABASE_URL)

# Create database sessions for API requests.
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# Test the connection to PostgreSQL.
def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT current_database()"))
        return result.scalar()
