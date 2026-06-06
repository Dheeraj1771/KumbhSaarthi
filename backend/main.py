from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database

app = FastAPI(title="KumbhSaarthi AI Operations API")

@app.get("/")
def read_root():
    return {"message": "KumbhSaarthi AI Operations Engine is Live. Visit /docs for the API interface."}

# Setup CORS so our React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Standard Endpoints ---

@app.get("/api/incidents", response_model=List[schemas.IncidentResponse])
def get_active_incidents(db: Session = Depends(database.get_db)):
    return db.query(models.Incident).filter(models.Incident.status == models.IncidentStatus.PENDING).all()

@app.get("/api/volunteers", response_model=List[schemas.VolunteerResponse])
def get_all_volunteers(db: Session = Depends(database.get_db)):
    return db.query(models.Volunteer).all()

# --- THE OPTIMIZATION ENGINE ---

@app.get("/api/optimize/{incident_id}", response_model=List[schemas.OptimizedMatchResponse])
def get_optimized_volunteers(incident_id: int, db: Session = Depends(database.get_db)):
    # 1. Fetch the incident
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # 2. Fetch all currently AVAILABLE volunteers
    available_volunteers = db.query(models.Volunteer).filter(
        models.Volunteer.status == models.VolunteerStatus.AVAILABLE
    ).all()

    scored_matches = []

    # 3. Run the scoring algorithm
    for vol in available_volunteers:
        # A. Skill Match (Weight: 50 points)
        has_skill = incident.required_skill in vol.skills
        skill_score = 50.0 if has_skill else 0.0

        # B. Proximity / Distance (Weight: 30 points)
        # Using sector ID difference as a simple proxy for physical distance
        distance = abs(vol.current_sector_id - incident.sector_id)
        distance_penalty = distance * 5.0 # Lose 5 points per sector away
        proximity_score = max(0.0, 30.0 - distance_penalty)

        # C. Fatigue / Workload (Weight: 20 points)
        # Penalize if they have worked a lot of hours
        fatigue_penalty = (vol.hours_worked / 8.0) * 20.0
        fatigue_score = max(0.0, 20.0 - fatigue_penalty)

        # Total Match Score
        total_score = skill_score + proximity_score + fatigue_score

        # Only consider them a viable match if they actually have the required skill
        if has_skill:
            scored_matches.append({
                "volunteer": vol,
                "match_score": round(total_score, 2),
                "skill_match": has_skill,
                "distance_penalty": distance_penalty,
                "fatigue_penalty": round(fatigue_penalty, 2)
            })

    # 4. Sort by highest score and return the top 3 recommendations
    scored_matches.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_matches[:3]