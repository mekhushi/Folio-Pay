import os
import time
import random
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()
# Also load root .env if it exists
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Minimal ERC-20 ABI for balance, decimals, and transfers
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function",
    },
]

class TreasuryManager:
    def __init__(self, private_key: str = None):
        self.rpc_url = os.getenv("WEB3_RPC_URL", "https://sepolia.base.org")
        self.private_key = private_key.strip() if private_key else os.getenv("TREASURY_PRIVATE_KEY", "").strip()
        self.stablecoin_address = os.getenv("STABLECOIN_ADDRESS", "0x036CbD53842c5426634e7929541eC2318f3dCF7e").strip()
        
        self.w3 = None
        self.treasury_address = None
        self.token_contract = None
        self.symbol = "USDC"
        self.decimals = 6
        self.is_active = False

        # Initialize Web3 connection if private key and RPC are present
        if self.private_key:
            try:
                from eth_account import Account
                account = Account.from_key(self.private_key)
                self.treasury_address = account.address
            except Exception as e:
                raise ValueError(f"Invalid private key format: {str(e)}")

            try:
                self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
                if not self.w3.is_connected():
                    raise ConnectionError(f"Could not connect to RPC URL: {self.rpc_url}")
                checksum_token = self.w3.to_checksum_address(self.stablecoin_address)
                self.token_contract = self.w3.eth.contract(address=checksum_token, abi=ERC20_ABI)
                
                try:
                    self.symbol = self.token_contract.functions.symbol().call()
                    self.decimals = self.token_contract.functions.decimals().call()
                except Exception:
                    pass
                
                self.is_active = True
                print(f"[Web3] Treasury initialized in Live Mode! Address: {self.treasury_address}")
            except Exception as e:
                print(f"[Web3] Initialization failed (RPC connection offline): {e}. Falling back to Simulation Mode.")
                self.is_active = False

    def get_balances(self):
        """Returns the treasury balance (ETH and Stablecoin)"""
        if self.is_active and self.w3:
            try:
                eth_balance = self.w3.eth.get_balance(self.treasury_address)
                eth_amount = self.w3.from_wei(eth_balance, "ether")
                
                token_balance = self.token_contract.functions.balanceOf(self.treasury_address).call()
                token_amount = token_balance / (10 ** self.decimals)
                
                return {
                    "eth": float(eth_amount),
                    "usdc": float(token_amount),
                    "mode": "live",
                    "treasury_address": self.treasury_address
                }
            except Exception as e:
                print(f"[Web3] Failed to fetch balances: {e}")
                
        # Return Simulated Balances
        return {
            "eth": 1.45,
            "usdc": 875.00,
            "mode": "simulation",
            "treasury_address": self.treasury_address if self.treasury_address else "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        }

    def execute_payout(self, recipient: str, amount_usd: float):
        """Executes a payout using stablecoins (Base Sepolia) or UPI simulation depending on format."""
        recipient = recipient.strip()
        if "@" in recipient:
            return self._execute_upi_payout(recipient, amount_usd)
        elif recipient.startswith("0x"):
            return self._execute_web3_payout(recipient, amount_usd)
        else:
            raise ValueError("Invalid recipient address. Must be a UPI ID or a 0x Web3 address.")

    def _execute_upi_payout(self, upi_id: str, amount_usd: float):
        """Simulates a TradFi payment gateway delay and exchange execution"""
        time.sleep(1.5)
        exchange_rate = 83.50
        amount_inr = amount_usd * exchange_rate
        rrn = "".join(random.choices("0123456789", k=12))
        return {
            "status": "success",
            "type": "upi",
            "mode": "Simulation (UPI Transfer)",
            "recipient": upi_id,
            "amount_paid": f"₹{amount_inr:,.2f} INR",
            "amount_usd": amount_usd,
            "exchange_rate": exchange_rate,
            "reference_number": rrn,
            "ref_no": rrn,
            "upi_id": upi_id,
            "message": "UPI payment successfully simulated."
        }

    def _execute_web3_payout(self, address: str, amount_usd: float):
        """Triggers a Web3 stablecoin payout on Base Sepolia"""
        if self.is_active and self.w3:
            try:
                checksum_recipient = self.w3.to_checksum_address(address)
                amount_raw = int(amount_usd * (10 ** self.decimals))
                nonce = self.w3.eth.get_transaction_count(self.treasury_address)
                
                # EIP-1559 gas fee estimation
                latest_block = self.w3.eth.get_block("latest")
                base_fee = latest_block.get("baseFeePerGas", 0)
                max_priority_fee = self.w3.to_wei('1.5', 'gwei')
                max_fee = base_fee * 2 + max_priority_fee

                tx = self.token_contract.functions.transfer(
                    checksum_recipient,
                    amount_raw
                ).build_transaction({
                    'from': self.treasury_address,
                    'nonce': nonce,
                    'gas': 65000,
                    'maxFeePerGas': max_fee,
                    'maxPriorityFeePerGas': max_priority_fee,
                    'chainId': 84532  # Base Sepolia Testnet
                })

                signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                
                # Wait for verification
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                
                if receipt['status'] == 1:
                    hash_str = self.w3.to_hex(tx_hash)
                    return {
                        "status": "success",
                        "type": "web3_live",
                        "mode": "Live (Base Sepolia)",
                        "recipient": address,
                        "amount_usd": amount_usd,
                        "amount_paid": f"{amount_usd:.2f} {self.symbol}",
                        "tx_hash": hash_str,
                        "explorer_link": f"https://sepolia.basescan.org/tx/{hash_str}",
                        "explorer_url": f"https://sepolia.basescan.org/tx/{hash_str}"
                    }
                else:
                    raise Exception("Transaction reverted on chain.")
            except Exception as e:
                print(f"[Web3] Real transaction failed: {e}. Falling back to simulation.")

        # Default Simulated Payout
        time.sleep(2.0)
        tx_hash = "0x" + "".join(random.choices("0123456789abcdef", k=64))
        return {
            "status": "success",
            "type": "web3_simulation",
            "mode": "Simulation (Base Sepolia)",
            "recipient": address,
            "amount_usd": amount_usd,
            "amount_paid": f"{amount_usd:.2f} USDC",
            "tx_hash": tx_hash,
            "explorer_link": f"https://sepolia.basescan.org/tx/{tx_hash}",
            "explorer_url": f"https://sepolia.basescan.org/tx/{tx_hash}"
        }
