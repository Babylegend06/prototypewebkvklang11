from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

WASAPBOT_API_URL = os.environ.get('WASAPBOT_API_URL', 'https://dash.wasapbot.my/whatsapp_api')
WASAPBOT_INSTANCE_ID = os.environ.get('WASAPBOT_INSTANCE_ID', '609ACF283XXXX')
WASAPBOT_ACCESS_TOKEN = os.environ.get('WASAPBOT_ACCESS_TOKEN', '695df3770b34a')

ESP32_HEARTBEAT_TIMEOUT = 15

class Machine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    machine_id: str
    status: str
    whatsapp_number: Optional[str] = None
    time_remaining: int = 0
    machine_type: str = "washer"
    price: float = 5.00
    last_heartbeat: Optional[str] = None
    payment_verified: bool = False

class MachineStartRequest(BaseModel):
    whatsapp_number: Optional[str] = None
    amount: float

class MachineStatusUpdate(BaseModel):
    status: str

class PaymentVerification(BaseModel):
    verified: bool

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    machine_id: str
    amount: float
    whatsapp_number: Optional[str]
    timestamp: datetime
    status: str = "completed"

class DashboardStats(BaseModel):
    active_machines: int
    total_revenue: float
    total_cycles: int
    today_revenue: float
    today_cycles: int

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class SessionData(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    user: User
    session_token: str

async def send_whatsapp(number: str, message: str):
    """Send WhatsApp message - skip if number is None/empty"""
    if not number or number.strip() == "":
        logging.info("WhatsApp notification skipped (no number provided)")
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "number": number,
                "type": "text",
                "message": message,
                "instance_id": WASAPBOT_INSTANCE_ID,
                "access_token": WASAPBOT_ACCESS_TOKEN
            }
            response = await client.get(WASAPBOT_API_URL, params=params, timeout=10.0)
            logging.info(f"WhatsApp API response: {response.status_code} - {response.text}")
            return response.status_code == 200
    except Exception as e:
        logging.error(f"WhatsApp send error: {e}")
        return False

async def check_esp32_heartbeat():
    """Check ESP32 heartbeat and set to broken if timeout"""
    machines = await db.machines.find({}, {"_id": 0}).to_list(100)
    current_time = datetime.now(timezone.utc)
    
    for machine in machines:
        if machine.get("last_heartbeat"):
            last_beat = datetime.fromisoformat(machine["last_heartbeat"])
            if last_beat.tzinfo is None:
                last_beat = last_beat.replace(tzinfo=timezone.utc)
            
            time_diff = (current_time - last_beat).total_seconds()
            
            if time_diff > ESP32_HEARTBEAT_TIMEOUT and machine["status"] != "broken":
                await db.machines.update_one(
                    {"machine_id": machine["machine_id"]},
                    {"$set": {"status": "broken"}}
                )
                logging.warning(f"Machine {machine['machine_id']} set to broken (ESP32 not responding)")

async def get_current_user(request: Request) -> Optional[User]:
    """Helper function to get current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return User(**user_doc)

@api_router.get("/")
async def root():
    return {"message": "Smart Dobi API"}

@api_router.get("/machines", response_model=List[Machine])
async def get_machines():
    """Get all machines status with ESP32 heartbeat check"""
    await check_esp32_heartbeat()
    
    machines = await db.machines.find({}, {"_id": 0}).to_list(100)
    
    if not machines:
        default_machines = [
            {
                "machine_id": "1",
                "status": "broken",
                "whatsapp_number": None,
                "time_remaining": 0,
                "machine_type": "washer",
                "price": 5.00,
                "last_heartbeat": None,
                "payment_verified": False
            },
            {
                "machine_id": "2",
                "status": "broken",
                "whatsapp_number": None,
                "time_remaining": 0,
                "machine_type": "washer",
                "price": 5.00,
                "last_heartbeat": None,
                "payment_verified": False
            }
        ]
        await db.machines.insert_many(default_machines)
        machines = default_machines
    
    return machines

@api_router.get("/machines/{machine_id}", response_model=Machine)
async def get_machine(machine_id: str):
    """Get single machine status"""
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    return machine

@api_router.post("/machines/{machine_id}/start")
async def start_machine(machine_id: str, data: MachineStartRequest):
    """Reserve machine - payment not yet verified"""
    if data.whatsapp_number:
        cleaned_number = data.whatsapp_number.replace(" ", "").replace("-", "").replace("+", "")
        if not cleaned_number.isdigit() or len(cleaned_number) < 10 or len(cleaned_number) > 15:
            raise HTTPException(
                status_code=400, 
                detail="Invalid WhatsApp number. Must be 10-15 digits."
            )
    
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if machine["status"] != "available":
        raise HTTPException(status_code=400, detail="Machine not available")
    
    await db.machines.update_one(
        {"machine_id": machine_id},
        {"$set": {
            "status": "reserved",
            "whatsapp_number": data.whatsapp_number,
            "time_remaining": 0,
            "payment_verified": False
        }}
    )
    
    return {"message": "Machine reserved", "machine_id": machine_id}

@api_router.post("/machines/{machine_id}/verify-payment")
async def verify_payment(machine_id: str, data: PaymentVerification):
    """Verify payment and start washing cycle"""
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if not data.verified:
        await db.machines.update_one(
            {"machine_id": machine_id},
            {"$set": {"status": "available", "whatsapp_number": None, "payment_verified": False}}
        )
        return {"message": "Payment cancelled"}
    
    await db.machines.update_one(
        {"machine_id": machine_id},
        {"$set": {
            "status": "washing",
            "payment_verified": True,
            "time_remaining": 0
        }}
    )
    
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction = {
        "transaction_id": transaction_id,
        "machine_id": machine_id,
        "amount": machine.get("price", 5.00),
        "whatsapp_number": machine.get("whatsapp_number"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "completed"
    }
    await db.transactions.insert_one(transaction)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.daily_records.update_one(
        {"date": today},
        {
            "$inc": {
                "total_cycles": 1,
                "total_revenue": machine.get("price", 5.00)
            }
        },
        upsert=True
    )
    
    if machine.get("whatsapp_number"):
        await send_whatsapp(
            machine["whatsapp_number"],
            f"Smart Dobi: Pembayaran berjaya! Sila ke Mesin {machine_id}, masukkan pakaian anda dan tekan button START. LED akan berkelip sebagai signal. Terima kasih! 🧺"
        )
    
    return {"message": "Payment verified", "transaction_id": transaction_id}

@api_router.put("/machines/{machine_id}/status")
async def update_machine_status(machine_id: str, status: str, time_remaining: int = 0):
    """Update machine status (called by ESP32) with heartbeat"""
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    update_data = {
        "status": status, 
        "time_remaining": time_remaining,
        "last_heartbeat": datetime.now(timezone.utc).isoformat()
    }
    
    if status == "available":
        if machine.get("whatsapp_number"):
            await send_whatsapp(
                machine["whatsapp_number"],
                f"Smart Dobi: Mesin {machine_id} telah SIAP! Sila ambil pakaian anda sekarang. Terima kasih! 🧺✨"
            )
        update_data["whatsapp_number"] = None
        update_data["time_remaining"] = 0
        update_data["payment_verified"] = False
    
    await db.machines.update_one(
        {"machine_id": machine_id},
        {"$set": update_data}
    )
    
    return {"message": "Machine status updated"}

@api_router.post("/machines/{machine_id}/reminder")
async def send_reminder(machine_id: str):
    """Send reminder WhatsApp (called by ESP32)"""
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine or not machine.get("whatsapp_number"):
        return {"message": "No WhatsApp number"}
    
    await send_whatsapp(
        machine["whatsapp_number"],
        f"Smart Dobi: MESIN {machine_id} HAMPIR SIAP DALAM 5 MINIT LAGI! Sila bersedia di mesin anda. Terima kasih! ⏰"
    )
    
    return {"message": "Reminder sent"}

@api_router.patch("/machines/{machine_id}/admin-status")
async def admin_update_status(machine_id: str, data: MachineStatusUpdate, request: Request):
    """Update machine status by owner (admin only)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    machine = await db.machines.find_one(
        {"machine_id": machine_id},
        {"_id": 0}
    )
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if data.status not in ["available", "broken"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'available' or 'broken'")
    
    update_data = {"status": data.status}
    if data.status == "available":
        update_data["time_remaining"] = 0
        update_data["whatsapp_number"] = None
        update_data["payment_verified"] = False
    elif data.status == "broken":
        update_data["time_remaining"] = 0
        update_data["whatsapp_number"] = None
        update_data["payment_verified"] = False
    
    await db.machines.update_one(
        {"machine_id": machine_id},
        {"$set": update_data}
    )
    
    return {"message": f"Machine {machine_id} status updated to {data.status}"}

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(request: Request):
    """Get transaction history (protected)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    transactions = await db.transactions.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    for txn in transactions:
        if isinstance(txn["timestamp"], str):
            txn["timestamp"] = datetime.fromisoformat(txn["timestamp"])
    
    return transactions

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics (protected)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    machines = await db.machines.find({}, {"_id": 0}).to_list(100)
    active_machines = sum(1 for m in machines if m["status"] == "washing")
    
    all_transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(txn["amount"] for txn in all_transactions)
    total_cycles = len(all_transactions)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_record = await db.daily_records.find_one(
        {"date": today},
        {"_id": 0}
    )
    
    today_revenue = today_record["total_revenue"] if today_record else 0.0
    today_cycles = today_record["total_cycles"] if today_record else 0
    
    return DashboardStats(
        active_machines=active_machines,
        total_revenue=total_revenue,
        total_cycles=total_cycles,
        today_revenue=today_revenue,
        today_cycles=today_cycles
    )

@api_router.post("/auth/session", response_model=SessionResponse)
async def create_session(data: SessionData, response: Response):
    """Process Google OAuth session"""
    try:
        async with httpx.AsyncClient() as http_client:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
            
            existing_user = await db.users.find_one(
                {"email": auth_data["email"]},
                {"_id": 0}
            )
            
            if existing_user:
                user_id = existing_user["user_id"]
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "name": auth_data["name"],
                        "picture": auth_data["picture"]
                    }}
                )
            else:
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                user_doc = {
                    "user_id": user_id,
                    "email": auth_data["email"],
                    "name": auth_data["name"],
                    "picture": auth_data["picture"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(user_doc)
            
            session_token = auth_data["session_token"]
            session_doc = {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.user_sessions.insert_one(session_doc)
            
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                path="/",
                max_age=7 * 24 * 60 * 60
            )
            
            user = await db.users.find_one(
                {"user_id": user_id},
                {"_id": 0}
            )
            if isinstance(user["created_at"], str):
                user["created_at"] = datetime.fromisoformat(user["created_at"])
            
            return SessionResponse(
                user=User(**user),
                session_token=session_token
            )
    
    except httpx.RequestError as e:
        logging.error(f"Auth request error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")

@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()