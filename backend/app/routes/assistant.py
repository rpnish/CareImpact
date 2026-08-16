import logging
import json
import time
import httpx
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.config import settings
from app.database import db_get_all_members
from app.priority_engine import calculate_dynamic_priority
from app.routes.members import doc_to_flat

logger = logging.getLogger("medicare.assistant")
router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    model: str
    latency_ms: int
    data_context_summary: Dict[str, Any]

SUGGESTED_PROMPTS = [
    {
        "id": "call_priority",
        "title": "📞 High-Priority Outreach Call List",
        "prompt": "Who are the top high-priority members I should call first today, and why are they ranked highest?",
        "category": "Outreach"
    },
    {
        "id": "star_target",
        "title": "🎯 #1 Target Measure Analysis",
        "prompt": "What is our #1 target measure to increase our Star Rating with the least effort according to CMS cutpoints?",
        "category": "Strategy"
    },
    {
        "id": "sim_projection",
        "title": "🔮 4.0 Star Leap Simulation",
        "prompt": "How many total care gaps do we need to close to cross the 4.0-Star threshold and unlock the 5% Quality Bonus Payment?",
        "category": "Simulation"
    },
    {
        "id": "eye_exam_boston",
        "title": "👁️ Diabetic Eye Gaps in Boston",
        "prompt": "List all members in Boston with open Diabetic Eye Exam gaps and their diagnosed conditions.",
        "category": "Clinical"
    },
    {
        "id": "bp_control_plan",
        "title": "❤️ Blood Pressure Control Strategy",
        "prompt": "Since Blood Pressure Control has a 3x CMS weight, what is our strategy to close pending BP gaps?",
        "category": "Strategy"
    }
]

def build_clinical_context(raw_members: List[dict]) -> tuple[str, Dict[str, Any]]:
    """Build a comprehensive, structured clinical and CMS Star dataset for Groq."""
    flat_members = [doc_to_flat(m) for m in raw_members]
    priority_res = calculate_dynamic_priority(flat_members)
    ranked_members = priority_res.get("member_ranking", flat_members)
    pm = priority_res.get("priority_measure", {})

    total_count = len(ranked_members)
    completed_count = sum(1 for m in ranked_members if m.get("overallStatus") == "completed")
    pending_count = sum(1 for m in ranked_members if m.get("overallStatus") == "pending")
    comp_pct = round((completed_count / total_count * 100), 1) if total_count > 0 else 0

    # Count open gaps per measure
    gap_counts = {
        "diabetic_eye_exam": sum(1 for m in ranked_members if m.get("diabetic_eye_exam_status") == "gap"),
        "blood_pressure_control": sum(1 for m in ranked_members if m.get("blood_pressure_control_status") == "gap"),
        "diabetes_med_adherence": sum(1 for m in ranked_members if m.get("diabetes_med_adherence_status") == "gap"),
        "flu_vaccination": sum(1 for m in ranked_members if m.get("flu_vaccination_status") == "gap")
    }

    # Top Rank 3 high-priority members
    high_priority_list = [m for m in ranked_members if m.get("priority_rank") == 3]

    # Compact member roster for LLM
    roster_lines = []
    for m in ranked_members:
        gaps = []
        if m.get("diabetic_eye_exam_status") == "gap":
            gaps.append("Diabetic Eye Exam (overdue >24mo)")
        if m.get("blood_pressure_control_status") == "gap":
            gaps.append(f"BP Control ({m.get('last_bp_reading') or 'Uncontrolled >=140/90'})")
        if m.get("diabetes_med_adherence_status") == "gap":
            gaps.append(f"Med Adherence ({m.get('adherence_pct') or 0}% PDC <80%)")
        if m.get("flu_vaccination_status") == "gap":
            gaps.append("Flu Shot (overdue <2024-07-01)")

        roster_lines.append(
            f"- Member: {m.get('member_name')} (ID: {m.get('member_id')}, Age: {m.get('age')}, City: {m.get('city')}, MA) | "
            f"Conditions: Diabetes={'Yes' if m.get('has_diabetes') else 'No'}, HTN={'Yes' if m.get('has_hypertension') else 'No'} | "
            f"Priority: Rank {m.get('priority_rank', 1)} ({m.get('priority_label', 'Normal')}), Score: {m.get('priority_score', 0)}, "
            f"Reachability: {m.get('reachability_score', 0)}/20 ({m.get('reachability_label', 'Unknown')}) | "
            f"Overall Status: {m.get('overallStatus')} | "
            f"Open Gaps: {', '.join(gaps) if gaps else 'None (Gap-Free Compliant)'}"
        )

    context_str = f"""
=== LIVE MEDICARE ADVANTAGE PLAN CONTEXT (MY2026 NCQA HEDIS) ===
- Plan Name: Medicare Advantage Plan Performance
- Baseline Star Rating: 3.30 Stars (3.5-Star Track)
- Total Active Members in Cohort: {total_count}
- Completed (Gap-Free Compliant): {completed_count} ({comp_pct}%)
- Actionable Pending Members (With Open Gaps): {pending_count} ({round(100 - comp_pct, 1)}%)

=== OPEN GAPS PER QUALITY MEASURE ===
1. C03: Annual Flu Vaccine (AIS-E) -> {gap_counts['flu_vaccination']} open gaps | Current Rate: 72.7% | 4★ Target: 68%, 5★ Target: 73% (CMS Weight: 1x)
2. C14: Controlling Blood Pressure (CBP) -> {gap_counts['blood_pressure_control']} open gaps | Current Rate: 72.7% | 4★ Target: 80%, 5★ Target: 86% (CMS Weight: 3x - TRIPLE WEIGHT!)
3. C11: Eye Exam for Diabetes (EED) -> {gap_counts['diabetic_eye_exam']} open gaps | Current Rate: 72.7% | 4★ Target: 80%, 5★ Target: 86% (CMS Weight: 1x)
4. D11: Diabetes Medication Adherence (PDC) -> {gap_counts['diabetes_med_adherence']} open gaps | Current Rate: 81.8% | 4★ Target: 84%, 5★ Target: 90% (CMS Weight: 1x)

=== DYNAMIC CMS STAR PRIORITY ENGINE #1 TARGET ===
- Measure: {pm.get('measure_name', 'Annual Flu Vaccine')} ({pm.get('measure_code', 'C03')})
- Current Rate: {pm.get('current_pct', 72.7)}% ({pm.get('current_star', 4)} Stars)
- Next Star Target: {pm.get('target_pct', 73.0)}% ({pm.get('target_star', 5)} Stars)
- Distance to Target: ONLY +{pm.get('distance_to_target', 0.3)}% needed! Closing just 1 flu gap jumps the measure to 5 Stars!

=== TOP PRIORITY OUTREACH COHORT (Rank 3 - Light Red Background in App) ===
Total Rank 3 High Priority Members: {len(high_priority_list)}
{chr(10).join(roster_lines[:15])}
... ({len(ranked_members)} total members loaded from Neon PostgreSQL)
"""

    summary_dict = {
        "total_members": total_count,
        "completed": completed_count,
        "pending": pending_count,
        "compliance_pct": comp_pct,
        "priority_target_measure": pm.get("measure_name", "Annual Flu Vaccine"),
        "high_priority_members_count": len(high_priority_list)
    }

    return context_str, summary_dict

@router.get("/suggestions")
async def get_suggestions():
    """Return smart suggested questions for clinical staff."""
    return {"suggestions": SUGGESTED_PROMPTS}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Groq Llama-3.3 70B AI Assistant endpoint with real-time patient clinical context.
    """
    groq_key = settings.GROQ_API_KEY.strip()
    if not groq_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured in backend .env."
        )

    # 1. Fetch live patient cohort from Neon PostgreSQL
    raw_members = await db_get_all_members()
    clinical_context, summary_dict = build_clinical_context(raw_members)

    system_instruction = f"""You are the CareImpact Clinical AI Assistant & Quality Director Copilot.
You specialize in NCQA HEDIS Quality Measures, Medicare Advantage Star Ratings (MY2026), clinical care gap closure, and employee outreach triage.

{clinical_context}

GUIDELINES FOR YOUR RESPONSES:
1. Always be precise, authoritative, clinical, and actionable. Use exact patient names, locations, clinical readings, and open gaps from the live context above.
2. When asked who to call first ("whom should I call?"):
   - List the top Rank 3 (High Priority) members first (e.g. members with reachability score 20 or 15 who have open gaps in the #1 target measure).
   - For each member, provide: Full Name, Age, City, Phone/Encounter Reachability, exact open care gaps, and a concise clinical script/action item for the nurse/employee.
3. When asked about Star Simulation or Targets:
   - Explain the exact compliance rates, CMS Part C cutpoints, and weighted star math.
   - Highlight that Blood Pressure Control has TRIPLE weight (3x) and Annual Flu Vaccine needs only +0.3% to reach 5 Stars.
   - Mention the 4.0-Star threshold unlocks the 5% Quality Bonus Payment (QBP) rebate subsidy.
4. Format responses cleanly using GitHub markdown: bold text, bullet points, and tables where appropriate.
5. If the user asks to summarize or query members in a specific city (e.g. Boston, Worcester), filter accurately from the cohort.
"""

    messages = [{"role": "system", "content": system_instruction}]

    # Add conversation history
    for h in (request.history or [])[-6:]:
        messages.append({"role": h.role, "content": h.content})

    # Add current user prompt
    messages.append({"role": "user", "content": request.message})

    # Call Groq API
    model_to_use = "llama-3.3-70b-versatile"
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_to_use,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 1200,
        "top_p": 0.95
    }

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"Groq API error {resp.status_code}: {resp.text}")
                # Fallback to llama-3.1-8b-instant if 70b is rate limited
                payload["model"] = "llama-3.1-8b-instant"
                fallback_resp = await client.post(url, headers=headers, json=payload)
                if fallback_resp.status_code == 200:
                    resp = fallback_resp
                    model_to_use = "llama-3.1-8b-instant"
                else:
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=f"Groq API Error: {resp.text}"
                    )

            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            elapsed_ms = int((time.time() - start_time) * 1000)

            return ChatResponse(
                reply=reply,
                model=model_to_use,
                latency_ms=elapsed_ms,
                data_context_summary=summary_dict
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Groq LLM inference timed out. Please try again."
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI response: {str(e)}"
        )
