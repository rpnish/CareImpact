import logging
import json
import time
import httpx
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("medicare.assistant")
router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    company_name: Optional[str] = "Medicare"
    company_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    model: str
    latency_ms: int
    data_context_summary: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Groq AI Assistant endpoint scoped dynamically to the selected insurance company.
    """
    groq_key = settings.GROQ_API_KEY.strip()
    if not groq_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured in backend .env."
        )

    company_name = request.company_name or "Medicare"
    ctx = request.company_context or {}

    # Build company-specific clinical system prompt
    system_instruction = f"""You are the CareImpact Clinical AI Assistant & Quality Intelligence Copilot for {company_name}.
You specialize in NCQA HEDIS Quality Measures, CMS Star Ratings (MY2026), chronic disease management, care gap closure, and clinical outreach prioritization for {company_name}.

ACTIVE INSURANCE COMPANY SCOPE:
- Company Name: {company_name}
- Enrolled Patients: {ctx.get('totalMembers', 22)}
- Overall Compliance Rate: {ctx.get('compliancePct', 0)}%
- Current Star Rating: {ctx.get('starRating', '3.8★')}
- Total Open Care Gaps: {ctx.get('totalGaps', 0)}

ASSIGNED CHRONIC DISEASE CRITERIA FOR {company_name}:
{ctx.get('criteriaSummary', 'Standard NCQA HEDIS criteria')}

HIGH PRIORITY PATIENTS WITH OPEN CARE GAPS IN {company_name}:
{ctx.get('prioritizedPatients', 'Patient records loaded in active session')}

GUIDELINES FOR YOUR RESPONSES:
1. You are strictly focused on {company_name}. Only discuss members, measures, and data belonging to {company_name}.
2. When asked who to call first ("whom should I call?", "high priority members"):
   - Identify the highest priority members (Score 100 or highest) who have open gaps in high-weighted measures (e.g. CBP 3x).
   - Provide: Patient Name, Age, ZIP, specific open care gap, Priority Score, and a concise clinical action script for the nurse/care coordinator.
3. When asked how to improve Star Ratings:
   - Explain the exact cutpoints and reachability for {company_name}'s assigned measures.
   - Highlight the mathematical impact of closing gaps in triple-weighted measures (CBP 3x) vs 1x process measures.
4. Keep answers professional, concise, clinical, and formatted cleanly using GitHub markdown (bullet points, bold text, tables).
"""

    messages = [{"role": "system", "content": system_instruction}]

    # Add conversation history
    for h in (request.history or [])[-6:]:
        messages.append({"role": h.role, "content": h.content})

    # Add current user prompt
    messages.append({"role": "user", "content": request.message})

    candidate_models = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "groq/compound"
    ]

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }

    start_time = time.time()
    last_error = ""
    last_status = 500

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for current_model in candidate_models:
                payload = {
                    "model": current_model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 1200,
                    "top_p": 0.95
                }
                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["choices"][0]["message"]["content"]
                        elapsed_ms = int((time.time() - start_time) * 1000)

                        return ChatResponse(
                            reply=reply,
                            model=current_model,
                            latency_ms=elapsed_ms,
                            data_context_summary={"company": company_name}
                        )
                    else:
                        logger.warning(f"Groq model {current_model} returned {resp.status_code}: {resp.text}")
                        last_error = resp.text
                        last_status = resp.status_code
                except Exception as model_err:
                    logger.warning(f"Error calling model {current_model}: {model_err}")
                    last_error = str(model_err)

            raise HTTPException(
                status_code=last_status,
                detail=f"Groq API Error: {last_error}"
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Groq LLM inference timed out. Please try again."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI response: {str(e)}"
        )
