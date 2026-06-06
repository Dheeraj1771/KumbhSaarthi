from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

import models, schemas, database

app = FastAPI(title="KumbhSaarthi AI Operations API")

# Setup CORS so the React frontend can communicate securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, replace "*" with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Deployment Request Schema
class DeployRequest(BaseModel):
    incident_id: int
    volunteer_id: int

# --- Root Endpoint ---
@app.get("/")
def read_root():
    return {"message": "KumbhSaarthi AI Operations Engine is Live. Visit /docs for the API interface."}

# --- Standard Endpoints ---

@app.get("/api/incidents", response_model=List[schemas.IncidentResponse])
def get_active_incidents(db: Session = Depends(database.get_db)):
    return db.query(models.Incident).filter(models.Incident.status == models.IncidentStatus.PENDING).all()

@app.get("/api/volunteers", response_model=List[schemas.VolunteerResponse])
def get_all_volunteers(db: Session = Depends(database.get_db)):
    return db.query(models.Volunteer).all()

@app.post("/api/volunteers", response_model=schemas.VolunteerResponse)
def recruit_volunteer(volunteer: schemas.VolunteerBase, db: Session = Depends(database.get_db)):
    new_vol = models.Volunteer(**volunteer.dict())
    db.add(new_vol)
    db.commit()
    db.refresh(new_vol)
    return new_vol

@app.post("/api/incidents", response_model=schemas.IncidentResponse)
def create_incident(incident: schemas.IncidentBase, db: Session = Depends(database.get_db)):
    new_incident = models.Incident(
        description=incident.description,
        required_skill=incident.required_skill,
        severity=incident.severity,
        sector_id=incident.sector_id,
        status=models.IncidentStatus.PENDING
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    return new_incident

# --- THE OPTIMIZATION ENGINE ---

@app.get("/api/optimize/{incident_id}", response_model=List[schemas.OptimizedMatchResponse])
def get_optimized_volunteers(incident_id: int, db: Session = Depends(database.get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    available_volunteers = db.query(models.Volunteer).filter(
        models.Volunteer.status == models.VolunteerStatus.AVAILABLE
    ).all()

    scored_matches = []

    for vol in available_volunteers:
        # A. Skill Match (Weight: 50 points)
        has_skill = incident.required_skill in vol.skills
        skill_score = 50.0 if has_skill else 0.0

        # B. Proximity / Distance (Weight: 30 points)
        distance = abs(vol.current_sector_id - incident.sector_id)
        distance_penalty = distance * 5.0
        proximity_score = max(0.0, 30.0 - distance_penalty)

        # C. Fatigue / Workload (Weight: 20 points)
        fatigue_penalty = (vol.hours_worked / 8.0) * 20.0
        fatigue_score = max(0.0, 20.0 - fatigue_penalty)

        total_score = skill_score + proximity_score + fatigue_score

        if has_skill:
            scored_matches.append({
                "volunteer": vol,
                "match_score": round(total_score, 2),
                "skill_match": has_skill,
                "distance_penalty": distance_penalty,
                "fatigue_penalty": round(fatigue_penalty, 2)
            })

    scored_matches.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_matches[:3]

@app.post("/api/deploy")
def execute_deployment(req: DeployRequest, db: Session = Depends(database.get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == req.incident_id).first()
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.id == req.volunteer_id).first()

    if not incident or not volunteer:
        raise HTTPException(status_code=404, detail="Data not found")

    incident.status = models.IncidentStatus.DISPATCHED
    volunteer.status = models.VolunteerStatus.DISPATCHED
    
    new_allocation = models.Allocation(
        volunteer_id=volunteer.id,
        incident_id=incident.id
    )
    
    db.add(new_allocation)
    db.commit()
    
    return {"status": "success", "message": f"Deployed {volunteer.name} to Incident {incident.id}"}