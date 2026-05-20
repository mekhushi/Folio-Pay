import json
from fastapi import FastAPI, Form, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from ai_agent import FolioAgent
from treasury import TreasuryManager

app = FastAPI(title="Folio Pay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = FolioAgent()
treasury = TreasuryManager()

@app.get("/api/treasury/balance")
def get_balance():
    return treasury.get_balances()

@app.get("/api/ledger")
def get_ledger():
    return agent.get_ledger()

@app.get("/api/rules")
def get_rules():
    return agent.get_rules()

class RulesUpdate(BaseModel):
    max_claim_limit: float
    monthly_budget: float

@app.post("/api/rules/update")
def update_rules(rules: RulesUpdate):
    current_rules = agent.get_rules()
    current_rules["max_claim_limit"] = rules.max_claim_limit
    current_rules["monthly_budget"] = rules.monthly_budget
    with open("rules.json", "w") as f:
        json.dump(current_rules, f, indent=2)
    return {"status": "success", "rules": current_rules}

@app.post("/api/claim/stream")
async def claim_stream(request: Request):
    form = await request.form()
    recipient = form.get("recipient", "user@upi")
    category = form.get("category", "Software")
    
    # Normally we'd use OCR on the uploaded image. For simulation we use mock text.
    receipt_text = "Simulated receipt text. Vercel $45.00"
    
    return StreamingResponse(agent.audit_claim_stream(receipt_text, str(recipient), str(category)), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
