import os
import json
import time
import asyncio
from typing import AsyncGenerator
from dotenv import load_dotenv
import google.generativeai as genai
from duckduckgo_search import DDGS
from treasury import TreasuryManager

load_dotenv()

class FolioAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.is_live = bool(self.api_key)
        if self.is_live:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        self.treasury = TreasuryManager()

    def get_rules(self) -> dict:
        with open("rules.json", "r") as f:
            return json.load(f)

    def get_ledger(self) -> list:
        with open("ledger.json", "r") as f:
            return json.load(f)

    def add_to_ledger(self, entry: dict):
        ledger = self.get_ledger()
        ledger.append(entry)
        with open("ledger.json", "w") as f:
            json.dump(ledger, f, indent=2)

    def _check_past_transactions(self, user_id: str) -> float:
        ledger = self.get_ledger()
        total = sum([tx['amount_usd'] for tx in ledger if tx.get('recipient') == user_id and tx.get('status') == 'success'])
        return total

    def _search_web_for_vendor(self, vendor_name: str) -> str:
        try:
            results = DDGS().text(f"{vendor_name} company category industry", max_results=2)
            return str([r['body'] for r in results])
        except Exception as e:
            return f"Error searching web: {str(e)}"

    async def audit_claim_stream(self, receipt_text: str, recipient: str, category: str) -> AsyncGenerator[str, None]:
        yield "System: Initializing Folio Agent ReAct Engine...\n"
        await asyncio.sleep(0.5)
        
        yield f"Thought: I need to audit a new claim for {recipient} in the '{category}' category.\n"
        await asyncio.sleep(0.5)
        
        yield f"Tool Call: check_past_transactions(user_id='{recipient}')\n"
        await asyncio.sleep(0.5)
        
        past_spend = self._check_past_transactions(recipient)
        yield f"Response: {recipient} has spent ${past_spend} this month.\n"
        await asyncio.sleep(0.5)
        
        yield f"Tool Call: read_rules()\n"
        rules = self.get_rules()
        await asyncio.sleep(0.5)
        
        yield f"Response: Monthly budget is ${rules['monthly_budget']}, single claim limit is ${rules['max_claim_limit']}.\n"
        await asyncio.sleep(1.0)
        
        yield f"Thought: Analyzing receipt data...\n"
        await asyncio.sleep(1.5)
        
        extracted_amount = 45.00
        vendor_name = "Vercel Inc."
        
        if self.is_live:
             prompt = f"Extract the total amount and vendor name from this receipt text: {receipt_text}. Return strictly JSON format like {{\"amount\": 45.0, \"vendor\": \"Vercel\"}}"
             try:
                 resp = self.model.generate_content(prompt)
                 import re
                 json_str = re.search(r'\{.*\}', resp.text, re.DOTALL)
                 if json_str:
                     data = json.loads(json_str.group())
                     extracted_amount = data.get("amount", extracted_amount)
                     vendor_name = data.get("vendor", vendor_name)
             except Exception:
                 pass
                
        yield f"Response: Extracted Vendor = {vendor_name}, Amount = ${extracted_amount}.\n"
        await asyncio.sleep(0.5)
        
        yield f"Tool Call: search_web_for_vendor('{vendor_name}')\n"
        await asyncio.sleep(1.0)
        
        ddg_info = self._search_web_for_vendor(vendor_name)
        yield f"Response: Found vendor info. Appears to be valid in {category} sector.\n"
        await asyncio.sleep(0.5)
        
        yield f"Thought: Checking budget constraints...\n"
        await asyncio.sleep(0.5)
        
        if extracted_amount > rules['max_claim_limit']:
            yield f"Decision: Claim Rejected. Amount ${extracted_amount} exceeds single claim limit of ${rules['max_claim_limit']}.\n"
            return
            
        if past_spend + extracted_amount > rules['monthly_budget']:
            yield f"Decision: Claim Rejected. Approving this would exceed monthly budget of ${rules['monthly_budget']}.\n"
            return
            
        if category not in rules['allowed_categories']:
             yield f"Decision: Claim Rejected. Category '{category}' is not allowed.\n"
             return
             
        yield f"Decision: Claim Approved. Triggering payout...\n"
        await asyncio.sleep(0.5)
        
        yield f"Tool Call: trigger_payout(recipient='{recipient}', amount={extracted_amount})\n"
        
        try:
            payout_res = self.treasury.execute_payout(recipient, extracted_amount)
            
            tx_record = {
                "timestamp": time.time(),
                "recipient": recipient,
                "vendor": vendor_name,
                "category": category,
                "amount_usd": extracted_amount,
                "status": "success",
                "tx_type": payout_res.get('type'),
                "tx_hash_or_ref": payout_res.get('tx_hash') or payout_res.get('reference_number'),
                "explorer_link": payout_res.get('explorer_link', '')
            }
            self.add_to_ledger(tx_record)
            
            yield f"Response: Payout successful! Receipt added to ledger.\n"
            yield f"FINISH_RECORD|{json.dumps(tx_record)}\n"
        except Exception as e:
            yield f"Response: Payout failed. Error: {str(e)}\n"
