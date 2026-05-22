import os
import json
from fastapi import FastAPI, Form, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from ai_agent import FolioAgent
from treasury import TreasuryManager

app = FastAPI(title="Folio Pay API")

# Configure CORS so the React frontend running on another port can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workspace memory storage
workspace_agents = {}

def get_agent(request: Request) -> FolioAgent:
    workspace_id = request.headers.get("X-Workspace-Id", "default").strip()
    private_key = request.headers.get("X-Treasury-Key", "").strip()
    
    if not workspace_id:
        workspace_id = "default"
        
    if workspace_id not in workspace_agents:
        workspace_agents[workspace_id] = FolioAgent(workspace_id, private_key or None)
    else:
        # Update private key if it has changed
        agent_instance = workspace_agents[workspace_id]
        if private_key and agent_instance.private_key != private_key:
            workspace_agents[workspace_id] = FolioAgent(workspace_id, private_key)
            
    return workspace_agents[workspace_id]

@app.get("/api/treasury/balance")
def get_balance(request: Request):
    agent = get_agent(request)
    return agent.treasury.get_balances()

@app.get("/api/ledger")
def get_ledger(request: Request):
    agent = get_agent(request)
    return agent.get_ledger()

@app.get("/api/rules")
def get_rules(request: Request):
    agent = get_agent(request)
    return agent.get_rules()

class LoginRequest(BaseModel):
    workspace_id: str
    private_key: Optional[str] = None
    gemini_key: Optional[str] = None

@app.post("/api/auth/login")
def login(req: LoginRequest):
    workspace_id = req.workspace_id.strip()
    if not workspace_id:
        return {"status": "error", "message": "Workspace ID cannot be empty"}
    try:
        agent = FolioAgent(workspace_id, req.private_key)
        if req.gemini_key:
            current_rules = agent.get_rules()
            if "api_keys" not in current_rules:
                current_rules["api_keys"] = {}
            current_rules["api_keys"]["gemini"] = req.gemini_key.strip()
            with open(agent.rules_path, "w") as f:
                json.dump(current_rules, f, indent=2)
            agent.reload_config()
            
        balances = agent.treasury.get_balances()
        role = "manager" if req.private_key else "employee"
        return {
            "status": "success",
            "workspace_id": workspace_id,
            "role": role,
            "address": agent.treasury.treasury_address or "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "mode": balances["mode"],
            "balances": balances,
            "rules": agent.get_rules()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

class RulesUpdate(BaseModel):
    max_claim_limit: float
    monthly_budget: float
    auto_approve_threshold: Optional[float] = None
    llm_engine: Optional[str] = None
    api_keys: Optional[dict] = None
    allowed_categories: Optional[list[str]] = None
    company_name: Optional[str] = None
    org_display_name: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    social_accounts: Optional[list[str]] = None

@app.post("/api/rules/update")
def update_rules(rules: RulesUpdate, request: Request):
    print(f"[Rules Update Request] Received rules: {rules.dict()}")
    agent = get_agent(request)
    current_rules = agent.get_rules()
    current_rules["max_claim_limit"] = rules.max_claim_limit
    current_rules["monthly_budget"] = rules.monthly_budget
    if rules.auto_approve_threshold is not None:
        current_rules["auto_approve_threshold"] = rules.auto_approve_threshold
    if rules.llm_engine is not None:
        current_rules["llm_engine"] = rules.llm_engine
    if rules.api_keys is not None:
        current_rules["api_keys"] = rules.api_keys
    if rules.allowed_categories is not None:
        current_rules["allowed_categories"] = rules.allowed_categories
    if rules.company_name is not None:
        current_rules["company_name"] = rules.company_name
    if rules.org_display_name is not None:
        current_rules["org_display_name"] = rules.org_display_name
    if rules.email is not None:
        current_rules["email"] = rules.email
    if rules.description is not None:
        current_rules["description"] = rules.description
    if rules.url is not None:
        current_rules["url"] = rules.url
    if rules.social_accounts is not None:
        current_rules["social_accounts"] = rules.social_accounts
    
    with open(agent.rules_path, "w") as f:
        json.dump(current_rules, f, indent=2)
        
    # Reload agent configuration so changes take effect
    agent.reload_config()
        
    return {"status": "success", "rules": current_rules}

class ClaimApprovalRequest(BaseModel):
    tx_id: str

@app.post("/api/claim/approve")
def approve_claim(req: ClaimApprovalRequest, request: Request):
    agent = get_agent(request)
    ledger = agent.get_ledger()
    target_tx = None
    target_idx = -1
    for idx, tx in enumerate(ledger):
        if tx.get("tx_id") == req.tx_id:
            target_tx = tx
            target_idx = idx
            break
            
    if not target_tx:
        return {"status": "error", "message": "Transaction not found."}
        
    if target_tx.get("status") != "PENDING_REVIEW":
        return {"status": "error", "message": f"Transaction is not pending review (current: {target_tx.get('status')})."}
        
    try:
        payout_res = agent.trigger_payout(target_tx["recipient"], target_tx["amount_usd"])
        
        target_tx["status"] = "APPROVED"
        target_tx["tx_type"] = payout_res.get('type', 'web3')
        target_tx["tx_hash_or_ref"] = payout_res.get('tx_hash') or payout_res.get('reference_number') or payout_res.get('ref_no')
        target_tx["explorer_link"] = payout_res.get('explorer_link', payout_res.get('explorer_url', ''))
        
        # Save ledger
        ledger[target_idx] = target_tx
        with open(agent.ledger_path, "w") as f:
            json.dump(ledger, f, indent=2)
            
        return {"status": "success", "transaction": target_tx}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/claim/reject")
def reject_claim(req: ClaimApprovalRequest, request: Request):
    agent = get_agent(request)
    ledger = agent.get_ledger()
    target_tx = None
    target_idx = -1
    for idx, tx in enumerate(ledger):
        if tx.get("tx_id") == req.tx_id:
            target_tx = tx
            target_idx = idx
            break
            
    if not target_tx:
        return {"status": "error", "message": "Transaction not found."}
        
    if target_tx.get("status") != "PENDING_REVIEW":
        return {"status": "error", "message": "Transaction is not pending review."}
        
    target_tx["status"] = "REJECTED"
    
    # Save ledger
    ledger[target_idx] = target_tx
    with open(agent.ledger_path, "w") as f:
        json.dump(ledger, f, indent=2)
        
    return {"status": "success", "transaction": target_tx}

@app.post("/api/claim/stream")
async def claim_stream(request: Request):
    agent = get_agent(request)
    form = await request.form()
    recipient = form.get("recipient", "user@upi")
    category = form.get("category", "Software")
    receipt_file = form.get("receipt")
    
    # Optional parameters for direct manual send
    amount_str = form.get("amount")
    vendor = form.get("vendor")
    
    manual_amount = float(amount_str) if amount_str else None
    manual_vendor = str(vendor) if vendor else None
    
    file_bytes = None
    mime_type = None
    if receipt_file and hasattr(receipt_file, "file"):
        file_bytes = await receipt_file.read()
        mime_type = receipt_file.content_type
        
    return StreamingResponse(
        agent.audit_claim_stream(
            file_bytes, 
            mime_type, 
            str(recipient), 
            str(category), 
            manual_amount, 
            manual_vendor
        ), 
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

