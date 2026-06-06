import sys
import os
import random

# Ensure local imports work cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Volunteer, Incident, VolunteerStatus, IncidentSeverity, IncidentStatus

def seed_data():
    db = SessionLocal()
    try:
        # 1. Clean up existing data to avoid duplicates if run multiple times
        print("Clearing old mock data...")
        db.query(Volunteer).delete()
        db.query(Incident).delete()
        db.commit()

        # 2. Define realistic Mahakumbh variables
        skills_pool = [
            "Medical Aid", 
            "Crowd Control", 
            "Multilingual Translation", 
            "Logistics & Supply", 
            "Disaster Management"
        ]
        
        first_names = ["Arjun", "Amit", "Rahul", "Sanjay", "Vijay", "Priya", "Anjali", "Deepak", "Rohan", "Sunita", "Rajesh", "Vikram", "Neha", "Karan", "Aman"]
        last_names = ["Sharma", "Verma", "Kumar", "Singh", "Joshi", "Patel", "Gupta", "Mishra", "Yadav", "Das"]

        print("Generating 50 specialized volunteers...")
        for i in range(1, 51):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Give some volunteers multiple skills, others just one
            num_skills = random.choice([1, 2])
            assigned_skills = random.sample(skills_pool, num_skills)
            skills_str = ", ".join(assigned_skills)
            
            # Randomize initial workloads and statuses to simulate an ongoing event
            status = random.choice([VolunteerStatus.AVAILABLE, VolunteerStatus.AVAILABLE, VolunteerStatus.RESTING])
            hours_worked = round(random.uniform(0.0, 7.5), 1) # some close to burnout
            
            # If they worked a lot, they might be resting or exhausted
            if hours_worked > 6.0:
                status = random.choice([VolunteerStatus.RESTING, VolunteerStatus.EXHAUSTED])

            volunteer = Volunteer(
                name=name,
                skills=skills_str,
                status=status,
                current_sector_id=random.randint(1, 10), # 10 different sectors/zones
                hours_worked=hours_worked
            )
            db.add(volunteer)

        # 3. Generate initial active incidents that need sorting
        print("Generating active operational incidents...")
        mock_incidents = [
            Incident(
                description="Heavy crowd buildup near VIP bathing ghat walkway.",
                required_skill="Crowd Control",
                severity=IncidentSeverity.MEDIUM,
                sector_id=3,
                status=IncidentStatus.PENDING
            ),
            Incident(
                description="Elderly pilgrim experiencing heat exhaustion near Transit Camp 2.",
                required_skill="Medical Aid",
                severity=IncidentSeverity.CRITICAL,
                sector_id=5,
                status=IncidentStatus.PENDING
            ),
            Incident(
                description="International delegation requires assistance with route mapping.",
                required_skill="Multilingual Translation",
                severity=IncidentSeverity.LOW,
                sector_id=1,
                status=IncidentStatus.PENDING
            ),
            Incident(
                description="Water distribution bottleneck reported at Sector 8 entrance.",
                required_skill="Logistics & Supply",
                severity=IncidentSeverity.MEDIUM,
                sector_id=8,
                status=IncidentStatus.PENDING
            )
        ]
        
        for incident in mock_incidents:
            db.add(incident)

        db.commit()
        print("Database successfully populated with Mahakumbh scenario data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()