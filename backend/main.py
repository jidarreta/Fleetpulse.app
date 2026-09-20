from fastapi import FastAPI, HTTPException, Path, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List
import uuid
import asyncio
import random
from datetime import datetime, timezone

app = FastAPI(
    title="FleetPulse Telematics API",
    version="1.0.0",
    docs_url="/docs"
)

class SHAPExplanation(BaseModel):
    feature: str
    impact: str
    message: str

class RiskScoreResponse(BaseModel):
    vehicle_id: uuid.UUID
    failure_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    estimated_days_to_failure: int
    primary_subsystem: str
    shap_explanations: List[SHAPExplanation]

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "FleetPulse Telematics API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get(
    "/api/v1/vehicles/{vehicle_id}/risk-score",
    response_model=RiskScoreResponse,
    status_code=200,
    tags=["Vehicle Diagnostics"]
)
async def get_vehicle_risk_score(
    vehicle_id: uuid.UUID = Path(..., description="Unique vehicle UUID v4 identifier")
):
    """
    Retrieves real-time hybrid machine learning risk assessments and 
    TreeSHAP feature attributions for a given vehicle.
    """
    try:
        # Simulated payload matching exact AWS ECS microservice contract
        return RiskScoreResponse(
            vehicle_id=vehicle_id,
            failure_probability=0.88,
            risk_level="CRITICAL",
            estimated_days_to_failure=12,
            primary_subsystem="Cooling System",
            shap_explanations=[
                SHAPExplanation(
                    feature="coolant_temp_14d_std",
                    impact="+0.34",
                    message="Coolant temp variance +18% under load"
                ),
                SHAPExplanation(
                    feature="fan_duty_cycle_mean",
                    impact="+0.21",
                    message="Cooling fan running at maximum speed 92% of time"
                )
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.websocket("/ws/telemetry/{vehicle_id}")
async def websocket_telemetry_stream(websocket: WebSocket, vehicle_id: str):
    """
    WebSocket streaming endpoint emitting live CAN bus telemetry updates every second.
    """
    await websocket.accept()
    base_coolant = 108.5
    base_voltage = 13.8
    base_rpm = 1620
    base_oil = 42.1
    try:
        while True:
            packet = {
                "coolant_temp": round(base_coolant + random.uniform(-0.8, 0.8), 1),
                "battery_voltage": round(base_voltage + random.uniform(-0.1, 0.1), 2),
                "engine_rpm": int(base_rpm + random.randint(-20, 20)),
                "oil_pressure": round(base_oil + random.uniform(-0.5, 0.5), 1),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await websocket.send_json(packet)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
