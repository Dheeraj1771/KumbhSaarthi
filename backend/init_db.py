import sys
import os

# Append current directory to path to handle imports cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import Base

def initialize_database():
    print("Connecting to PostgreSQL and creating tables...")
    # Base.metadata.create_all reads our models.py file and builds the architecture in Postgres
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    initialize_database()