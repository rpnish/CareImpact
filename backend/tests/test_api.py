import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, close_db

@pytest.mark.asyncio
async def test_full_api_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check & root
        res_health = await client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 2. Resync data from data.csv
        res_sync = await client.post("/admin/resync")
        assert res_sync.status_code == 200
        sync_data = res_sync.json()
        assert sync_data["status"] == "success"
        assert sync_data["rows_read"] > 0

        # 3. Check sync-status
        res_status = await client.get("/admin/sync-status")
        assert res_status.status_code == 200
        assert res_status.json()["status"] == "success"

        # 4. List members
        res_members = await client.get("/members")
        assert res_members.status_code == 200
        members = res_members.json()
        assert len(members) > 0

        # Verify Pending / Completed filtering
        res_pending = await client.get("/members?status=pending")
        assert res_pending.status_code == 200
        for m in res_pending.json():
            assert m["overallStatus"] == "pending"

        res_completed = await client.get("/members?status=completed")
        assert res_completed.status_code == 200
        for m in res_completed.json():
            assert m["overallStatus"] == "completed"

        # 5. Create new member live via POST /members
        # Member with diabetes, overdue eye exam (gap) and overdue flu (gap)
        new_member_payload = {
            "name": "Alex Mercer",
            "age": 64,
            "gender": "M",
            "city": "Boston",
            "state": "Massachusetts",
            "has_diabetes": True,
            "has_hypertension": True,
            "last_exam_date": "2023-01-10",  # Overdue (>24mo) -> gap
            "last_bp_reading": "115/75",     # Controlled -> compliant
            "adherence_pct": 95.0,           # >= 80% -> compliant
            "last_flu_shot_date": "2023-05-01" # Overdue -> gap
        }
        res_create = await client.post("/members", json=new_member_payload)
        assert res_create.status_code == 201
        created = res_create.json()
        assert created["member_name"] == "Alex Mercer"
        assert created["diabetic_eye_exam_status"] == "gap"
        assert created["blood_pressure_control_status"] == "compliant"
        assert created["diabetes_med_adherence_status"] == "compliant"
        assert created["flu_vaccination_status"] == "gap"
        assert created["overallStatus"] == "pending"
        assert created["priorityScore"] == 0
        created_id = created["member_id"]

        # 6. Retrieve single member
        res_get = await client.get(f"/members/{created_id}")
        assert res_get.status_code == 200
        assert res_get.json()["member_name"] == "Alex Mercer"

        # 7. Edit member via PUT /members/{id} to close gaps
        update_payload = {
            "last_exam_date": "2026-03-15",     # Now compliant
            "last_flu_shot_date": "2025-11-20"  # Now compliant
        }
        res_update = await client.put(f"/members/{created_id}", json=update_payload)
        assert res_update.status_code == 200
        updated = res_update.json()
        assert updated["diabetic_eye_exam_status"] == "compliant"
        assert updated["flu_vaccination_status"] == "compliant"
        assert updated["overallStatus"] == "completed"

        # 8. Analytics summary
        res_summary = await client.get("/analytics/summary")
        assert res_summary.status_code == 200
        summary = res_summary.json()
        assert "overall_star_rating" in summary
        assert summary["total_members"] >= len(members)
        assert len(summary["measures"]) == 4

        # 9. Analytics geo & trend
        res_geo = await client.get("/analytics/geo")
        assert res_geo.status_code == 200
        assert len(res_geo.json()) > 0

        res_trend = await client.get("/analytics/trend")
        assert res_trend.status_code == 200
        assert len(res_trend.json()) > 0

        # 10. Delete member
        res_del = await client.delete(f"/members/{created_id}")
        assert res_del.status_code == 200

        res_get_del = await client.get(f"/members/{created_id}")
        assert res_get_del.status_code == 404
