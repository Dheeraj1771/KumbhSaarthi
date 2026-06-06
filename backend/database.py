import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# For PostgreSQL, create the engine
engine = create_engine(DATABASE_URL)

# Create a thread-safe session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get the database session for API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()