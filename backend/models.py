from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import enum

# This is the object the initialization script is looking for
Base = declarative_base()

# --- State Machine Enums ---
class VolunteerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    ON_SITE = "ON_SITE"
    RESTING = "RESTING"
    EXHAUSTED = "EXHAUSTED"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    RESOLVED = "RESOLVED"

# --- Database Models ---
class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    skills = Column(String, nullable=False)  # Comma-separated values: e.g., "Medical, Crowd Control"
    status = Column(Enum(VolunteerStatus), default=VolunteerStatus.AVAILABLE, index=True)
    current_sector_id = Column(Integer, nullable=False, index=True)
    hours_worked = Column(Float, default=0.0)

    allocations = relationship("Allocation", back_populates="volunteer")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    required_skill = Column(String, nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    sector_id = Column(Integer, nullable=False, index=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.PENDING, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    allocations = relationship("Allocation", back_populates="incident")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    dispatched_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    volunteer = relationship("Volunteer", back_populates="allocations")
    incident = relationship("Incident", back_populates="allocations")