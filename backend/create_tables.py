from database import engine
from models import Base

# Create any database tables that do not already exist.
Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")
