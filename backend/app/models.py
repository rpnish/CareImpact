from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone

MeasureStatus = Literal["compliant", "gap", "not_eligible"]
OverallStatus = Literal["pending", "completed"]

class MeasureDetail(BaseModel):
    status: MeasureStatus
    value: Optional[Any] = None

class MeasuresMap(BaseModel):
    diabetic_eye_exam: MeasureDetail
    blood_pressure_control: MeasureDetail
    diabetes_med_adherence: MeasureDetail
    flu_vaccination: MeasureDetail

class MemberLocation(BaseModel):
    city: str
    state: str = "Massachusetts"

class MemberInsurance(BaseModel):
    company: str = "Medicare"
    planType: str = "Medicare Advantage"

class MemberConditions(BaseModel):
    diabetes: bool = False
    hypertension: bool = False

class MemberDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    location: MemberLocation
    insurance: MemberInsurance = Field(default_factory=MemberInsurance)
    conditions: MemberConditions
    measures: MeasuresMap
    overallStatus: OverallStatus
    priorityScore: int = 0
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MemberFlat(BaseModel):
    member_id: str
    member_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    city: str
    state: str
    insurance_company: str
    has_diabetes: bool
    has_hypertension: bool
    diabetic_eye_exam_status: MeasureStatus
    last_exam_date: Optional[str] = None
    blood_pressure_control_status: MeasureStatus
    last_bp_reading: Optional[str] = None
    diabetes_med_adherence_status: MeasureStatus
    adherence_pct: Optional[float] = None
    flu_vaccination_status: MeasureStatus
    last_flu_shot_date: Optional[str] = None
    overallStatus: OverallStatus
    priorityScore: int = 0
    updatedAt: Optional[str] = None

class MemberCreateInput(BaseModel):
    member_id: Optional[str] = None
    name: str
    age: Optional[int] = None
    gender: Optional[str] = "M"
    city: str
    state: Optional[str] = "Massachusetts"
    insurance_company: Optional[str] = "Medicare"
    has_diabetes: bool = False
    has_hypertension: bool = False
    last_exam_date: Optional[str] = None
    last_bp_reading: Optional[str] = None
    adherence_pct: Optional[float] = None
    last_flu_shot_date: Optional[str] = None

class MemberUpdateInput(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    insurance_company: Optional[str] = None
    has_diabetes: Optional[bool] = None
    has_hypertension: Optional[bool] = None
    last_exam_date: Optional[str] = None
    last_bp_reading: Optional[str] = None
    adherence_pct: Optional[float] = None
    last_flu_shot_date: Optional[str] = None

class MeasureSummaryItem(BaseModel):
    measure_key: str
    name: str
    code: str
    description: str
    eligible_count: int
    compliant_count: int
    gap_count: int
    rate_pct: float
    cutpoint_3star: float
    cutpoint_4star: float
    cutpoint_5star: float
    current_stars: float
    weight: int = 1

class AnalyticsSummaryResponse(BaseModel):
    overall_star_rating: float
    total_members: int
    completed_count: int
    pending_count: int
    completion_rate_pct: float
    measures: List[MeasureSummaryItem]
    predicted_star_rating_if_closed: float

class TrendPoint(BaseModel):
    month: str
    star_rating: float
    compliance_rate: float
    open_gaps: int

class GeoPoint(BaseModel):
    city: str
    state: str
    lat: float
    lng: float
    total_members: int
    completed_members: int
    pending_members: int
    pending_rate_pct: float

class SyncStatusResponse(BaseModel):
    status: str
    last_sync_timestamp: Optional[str] = None
    rows_read: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = []
