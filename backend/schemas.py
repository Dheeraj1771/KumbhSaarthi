from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models import VolunteerStatus, IncidentSeverity, IncidentStatus

# --- Volunteer Schemas ---
class VolunteerBase(BaseModel):
    name: str
    skills: str
    status: VolunteerStatus
    current_sector_id: int
    hours_worked: float

class VolunteerResponse(VolunteerBase):
    id: int

    class Config:
        from_attributes = True

# --- Incident Schemas ---
class IncidentBase(BaseModel):
    description: str
    required_skill: str
    severity: IncidentSeverity
    sector_id: int
    status: IncidentStatus

class IncidentResponse(IncidentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Optimization Response Schema ---
class OptimizedMatchResponse(BaseModel):
    volunteer: VolunteerResponse
    match_score: float
    skill_match: bool
    distance_penalty: float
    fatigue_penalty: float