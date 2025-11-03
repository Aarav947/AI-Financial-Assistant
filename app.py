from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from sklearn.preprocessing import LabelEncoder
import pickle
import pandas as pd

# Initialize FastAPI
app = FastAPI(title="Banking Assistant API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)  # ✅ Fixed: Added closing parenthesis

# Session storage (in-memory for now)
session_context: Dict[str, Dict] = {}

# ============================================
# LOAD MODEL AND LABEL ENCODER
# ============================================
print("🔄 Loading model and tokenizer...")

MODEL_PATH = "./model"
DATASET_PATH = "./intent_dataset.csv"

try:
    # Load tokenizer and model
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_PATH)
    model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
    
    # Regenerate label encoder from dataset
    df = pd.read_csv(DATASET_PATH)
    label_encoder = LabelEncoder()
    label_encoder.fit(df['sub_intent'])
    
    print("✅ Model and label encoder loaded successfully!")
    print(f"📊 Labels: {label_encoder.classes_}")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    raise

# ============================================
# INTENT PREDICTION
# ============================================
def predict_intent(text: str) -> str:
    """Predicts intent from user input"""
    inputs = tokenizer(text, 
                      return_tensors="pt", 
                      truncation=True, 
                      padding=True, 
                      max_length=32)
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        
    predicted_class = torch.argmax(logits, dim=1).item()
    intent = label_encoder.inverse_transform([predicted_class])[0]
    
    return intent

# ============================================
# BANK DETECTION
# ============================================
def detect_bank(text: str) -> Optional[str]:
    """Detects which bank/platform user is referring to"""
    text_lower = text.lower()
    
    if 'sbi' in text_lower or 'state bank' in text_lower:
        return 'SBI'
    elif 'hdfc' in text_lower:
        return 'HDFC'
    elif 'icici' in text_lower:
        return 'ICICI'
    elif 'axis' in text_lower:
        return 'Axis'
    elif 'kotak' in text_lower:
        return 'Kotak'
    elif 'google pay' in text_lower or 'gpay' in text_lower:
        return 'Google Pay'
    elif 'paytm' in text_lower:
        return 'Paytm'
    elif 'phonepe' in text_lower or 'phone pe' in text_lower:
        return 'PhonePe'
    else:
        return None

# ============================================
# INTENT HANDLERS
# ============================================
INTENT_HANDLERS = {
    # ==================== GREETINGS & GENERAL ====================
    'greeting_general': {
        'message': "Hello! 👋 I'm your Banking & Payments Assistant. I can help you with:\n\n• Password resets & account security\n• Account statements & transaction history\n• Lost/blocked cards\n• UPI payment issues\n• Balance inquiries\n• And much more!\n\nWhat do you need help with today?",
        'type': 'info'
    },
    
    'goodbye_general': {
        'message': "Thank you for using our Banking Assistant! Have a great day! 😊\n\nFeel free to come back anytime you need help with your banking needs.",
        'type': 'info'
    },
    
    'thanks_general': {
        'message': "You're most welcome! 😊 I'm always here to help.\n\nIs there anything else I can assist you with today?",
        'type': 'info'
    },
    
    # ==================== ACCOUNT PASSWORD RESET ====================
    'account_password_reset': {
        'SBI': {
            'message': "I can help you reset your SBI password. Which service do you need help with?",
            'workflows': [
                {
                    'name': 'Internet Banking (OnlineSBI)',
                    'steps': [
                        "Visit https://retail.onlinesbi.sbi/retail/login.htm",
                        "Click 'Forgot Login Password'",
                        "Enter your Username",
                        "Enter OTP sent to registered mobile",
                        "Create new password (must include uppercase, lowercase, number, and special character)"
                    ],
                    'link': 'https://retail.onlinesbi.sbi/retail/login.htm'
                },
                {
                    'name': 'YONO App',
                    'steps': [
                        "Open YONO SBI app",
                        "Tap 'Forgot Password'",
                        "Enter CIF/Username",
                        "Verify via OTP",
                        "Set new password"
                    ]
                }
            ]
        },
        'HDFC': {
            'message': "I can help you reset your HDFC password.",
            'workflows': [
                {
                    'name': 'NetBanking',
                    'steps': [
                        "Go to https://netbanking.hdfcbank.com",
                        "Click 'Forgot IPIN'",
                        "Enter Customer ID",
                        "Verify via Debit Card details",
                        "Enter OTP sent to registered mobile",
                        "Create new password"
                    ],
                    'link': 'https://netbanking.hdfcbank.com'
                }
            ]
        },
        'ICICI': {
            'message': "To reset your ICICI password:",
            'workflows': [
                {
                    'name': 'Internet Banking',
                    'steps': [
                        "Visit https://infinity.icicibank.com",
                        "Click 'Forgot User ID/Password'",
                        "Enter registered mobile/email",
                        "Verify OTP",
                        "Create new password"
                    ],
                    'link': 'https://infinity.icicibank.com'
                }
            ]
        },
        'Axis': {
            'message': "To reset your Axis Bank password:",
            'workflows': [
                {
                    'name': 'Internet Banking',
                    'steps': [
                        "Go to https://retail.axisbank.co.in",
                        "Click 'Forgot Password'",
                        "Enter Customer ID",
                        "Verify via registered mobile",
                        "Create new password"
                    ],
                    'link': 'https://retail.axisbank.co.in'
                }
            ]
        },
        'Kotak': {
            'message': "To reset your Kotak Mahindra password:",
            'workflows': [
                {
                    'name': 'Net Banking',
                    'steps': [
                        "Visit https://netbanking.kotak.com",
                        "Click 'Forgot Password'",
                        "Enter CRN/Customer ID",
                        "Verify via OTP",
                        "Set new password"
                    ],
                    'link': 'https://netbanking.kotak.com'
                }
            ]
        },
        'Google Pay': {
            'message': "To reset your Google Pay PIN:",
            'workflows': [
                {
                    'name': 'Reset Google Pay PIN',
                    'steps': [
                        "Open Google Pay app",
                        "Tap profile picture (top right)",
                        "Go to Settings → Privacy & Security",
                        "Tap 'Change Google Pay PIN'",
                        "Verify identity via linked bank account",
                        "Enter new 4-6 digit PIN"
                    ]
                }
            ]
        },
        'Paytm': {
            'message': "To reset your Paytm password:",
            'workflows': [
                {
                    'name': 'Reset Password',
                    'steps': [
                        "Open Paytm app",
                        "Tap Profile → Settings",
                        "Select 'Change Password'",
                        "Verify via OTP",
                        "Enter new password"
                    ]
                }
            ]
        },
        'PhonePe': {
            'message': "To reset your PhonePe PIN:",
            'workflows': [
                {
                    'name': 'Reset PIN',
                    'steps': [
                        "Open PhonePe app",
                        "Tap Profile icon",
                        "Go to Settings",
                        "Select 'Change PIN'",
                        "Verify via OTP",
                        "Enter new PIN"
                    ]
                }
            ]
        }
    },
    
    # ==================== ACCOUNT STATEMENT ====================
    'account_statement': {
        'SBI': {
            'message': "Here's how to get your SBI account statement:",
            'workflows': [
                {
                    'name': 'YONO App',
                    'steps': [
                        "Login to YONO SBI",
                        "Go to Accounts → Select account",
                        "Tap Statement",
                        "Select date range (up to 6 months)",
                        "Download PDF or send to email"
                    ]
                },
                {
                    'name': 'Internet Banking',
                    'steps': [
                        "Login to OnlineSBI",
                        "Go to 'Account Statement'",
                        "Select account and date range",
                        "Download statement (PDF/Excel)"
                    ],
                    'link': 'https://retail.onlinesbi.sbi'
                },
                {
                    'name': 'SMS Service',
                    'steps': [
                        "Send SMS: MSTMT to 9223766666",
                        "You'll receive last 5 transactions via SMS"
                    ]
                }
            ]
        },
        'HDFC': {
            'message': "To get your HDFC account statement:",
            'workflows': [
                {
                    'name': 'NetBanking',
                    'steps': [
                        "Login to HDFC NetBanking",
                        "Go to Accounts → Statement",
                        "Select date range",
                        "Download PDF or send to email"
                    ]
                },
                {
                    'name': 'Mobile Banking',
                    'steps': [
                        "Open HDFC Mobile Banking app",
                        "Tap on Account",
                        "Select 'Account Statement'",
                        "Choose period and download"
                    ]
                }
            ]
        },
        'ICICI': {
            'message': "To get your ICICI account statement:",
            'workflows': [
                {
                    'name': 'Internet Banking',
                    'steps': [
                        "Login to ICICI NetBanking",
                        "Go to Accounts → Statement",
                        "Select account and date range",
                        "Download statement"
                    ]
                },
                {
                    'name': 'iMobile App',
                    'steps': [
                        "Open iMobile app",
                        "Tap Accounts",
                        "Select 'Statement'",
                        "Download or email statement"
                    ]
                }
            ]
        },
        'Axis': {
            'message': "To get your Axis account statement:",
            'workflows': [
                {
                    'name': 'Internet Banking',
                    'steps': [
                        "Login to Axis NetBanking",
                        "Go to Accounts → Statement",
                        "Select period",
                        "Download statement"
                    ]
                }
            ]
        },
        'Kotak': {
            'message': "To get your Kotak account statement:",
            'workflows': [
                {
                    'name': 'Net Banking',
                    'steps': [
                        "Login to Kotak NetBanking",
                        "Go to Accounts → Statement",
                        "Select date range",
                        "Download or email"
                    ]
                }
            ]
        }
    },
    
    
'loan_eligibility_check': {
    'SBI': {
        'message': "Let's check your SBI loan eligibility!",
        'workflows': [
            {
                'name': 'Home Loan Eligibility',
                'steps': [
                    "Age: 21-65 years",
                    "Min income: ₹25,000/month",
                    "Credit score: 650+",
                    "Employment: Min 2 years",
                    "Loan Amount: Up to ₹5 crore",
                    "Interest Rate: 8.50% - 9.65% p.a."
                ],
                'link': 'https://sbi.co.in/homeloan',
                'calculator_available': True  
            },
            {
                'name': 'Personal Loan Eligibility',
                'steps': [
                    "Age: 21-58 years",
                    "Min income: ₹15,000/month",
                    "Credit score: 700+",
                    "Loan Amount: Up to ₹20 lakh",
                    "Interest Rate: 9.60% - 11.15% p.a."
                ]
            }
        ],
        'calculator_available': True  
    },
    'HDFC': {
        'message': "I can help with HDFC loan eligibility!",
        'workflows': [
            {
                'name': 'Home Loan',
                'steps': [
                    "Age: 21-65 years",
                    "Min income: ₹25,000/month",
                    "Credit score: 650+",
                    "Work experience: 2+ years",
                    "Loan Amount: Up to ₹10 crore",
                    "Interest Rate: 8.35% - 9.50% p.a."
                ],
                'link': 'https://hdfc.com/homeloan'
            }
        ],
        'calculator_available': True  
    },
    'ICICI': {
        'message': "Let me show ICICI loan options!",
        'workflows': [
            {
                'name': 'Home Loan',
                'steps': [
                    "Age: 23-65 years",
                    "Min income: ₹30,000/month",
                    "Credit score: 700+",
                    "Loan Amount: Up to ₹15 crore",
                    "Interest Rate: 8.40% - 9.55% p.a."
                ]
            }
        ],
        'calculator_available': True  
    }
},

    # ==================== CARD LOST/BLOCKED ====================
    'card_lost_blocked': {
        'SBI': {
            'message': "⚠️ URGENT: Block your SBI card immediately:",
            'workflows': [
                {
                    'name': 'Customer Care (24x7)',
                    'steps': [
                        "Call: 1800 11 2211 or 1800 425 3800",
                        "Select 'Block Card' option",
                        "Provide card details for verification",
                        "Card will be blocked instantly"
                    ],
                    'urgent': True
                },
                {
                    'name': 'YONO App',
                    'steps': [
                        "Login to YONO SBI",
                        "Go to Cards",
                        "Select your card",
                        "Tap 'Block Card'",
                        "Confirm blocking"
                    ],
                    'urgent': True
                }
            ]
        },
        'HDFC': {
            'message': "⚠️ Block your HDFC card immediately:",
            'workflows': [
                {
                    'name': 'PhoneBanking',
                    'steps': [
                        "Call: 1800 266 4332",
                        "Request card blocking",
                        "Verify identity",
                        "Card blocked immediately"
                    ],
                    'urgent': True
                }
            ]
        },
        'ICICI': {
            'message': "⚠️ Block your ICICI card immediately:",
            'workflows': [
                {
                    'name': 'Customer Care',
                    'steps': [
                        "Call: 1860 120 7777",
                        "Request card blocking",
                        "Verify identity",
                        "Card blocked instantly"
                    ],
                    'urgent': True
                }
            ]
        }
    },
    
    # ==================== UPI PAYMENT FAILURE ====================
    'upi_payment_failure': {
        'Google Pay': {
            'message': "If your Google Pay payment failed:",
            'workflows': [
                {
                    'name': 'Check Payment Status',
                    'steps': [
                        "Open Google Pay",
                        "Tap Activity/Transactions",
                        "Find the failed transaction",
                        "Check status: If money deducted, auto-refund in 5-7 business days",
                        "Tap transaction → 'Get Help' to raise dispute if needed"
                    ]
                }
            ]
        },
        'Paytm': {
            'message': "For Paytm payment failure:",
            'workflows': [
                {
                    'name': 'Check and Resolve',
                    'steps': [
                        "Open Paytm",
                        "Go to Passbook",
                        "Find failed transaction",
                        "Tap → 'Raise Issue'",
                        "Refund will be processed in 7 working days"
                    ]
                }
            ]
        },
        'PhonePe': {
            'message': "For PhonePe payment failure:",
            'workflows': [
                {
                    'name': 'Resolve Failure',
                    'steps': [
                        "Open PhonePe",
                        "Go to History",
                        "Find failed payment",
                        "Tap 'Report Issue'",
                        "Refund in 5-7 business days"
                    ]
                }
            ]
        }
    },
    
    # ==================== BALANCE CHECK ====================
    'balance_check': {
        'message': "To check your account balance, you can use any of these methods based on your bank:",
        'type': 'info_with_bank_prompt'
    },
    
    # ==================== MINI STATEMENT ====================
    'mini_statement': {
        'message': "For a mini statement (last few transactions), please specify your bank and I'll provide the quickest method.",
        'type': 'info_with_bank_prompt'
    },
    
    # ==================== CARD ACTIVATION ====================
    'card_activation': {
        'message': "To activate your new debit/credit card, please tell me which bank issued the card.",
        'type': 'info_with_bank_prompt'
    },
    
    # ==================== OTHERS ====================
    'fund_transfer': {
        'message': "For fund transfers, you have multiple options:\n\n• NEFT/RTGS (for bank-to-bank transfers)\n• IMPS (immediate payment)\n• UPI (instant transfers)\n\nWhich method would you like help with?",
        'type': 'info'
    },
    
    'cheque_status': {
        'message': "To check cheque status, please specify your bank. I'll guide you through their specific process.",
        'type': 'info_with_bank_prompt'
    },
    
    'update_mobile_number': {
        'message': "To update your mobile number, you typically need to:\n\n1. Visit your bank branch with ID proof\n2. Fill mobile number update form\n3. Or use NetBanking (if already linked)\n\nWhich bank's mobile number do you want to update?",
        'type': 'info_with_bank_prompt'
    }
}

def calculate_loan_eligibility(monthly_income, existing_emi, property_value):
    """
    Calculate home loan eligibility based on income and obligations
    
    Standard banking criteria:
    - FOIR (Fixed Obligation to Income Ratio): 50% (max 50% of income can go to EMIs)
    - Interest Rate: 8.5% p.a. (typical home loan rate)
    - Tenure: 20 years (240 months)
    - LTV (Loan to Value): 80% of property value (max)
    """
    
    # Constants
    FOIR = 0.50  # 50% - industry standard
    INTEREST_RATE_ANNUAL = 8.5
    INTEREST_RATE_MONTHLY = INTEREST_RATE_ANNUAL / 12 / 100
    TENURE_MONTHS = 240  # 20 years
    LTV_RATIO = 0.80  # 80% of property value
    
    # Step 1: Calculate maximum affordable EMI
    max_total_emi = monthly_income * FOIR
    max_new_emi = max_total_emi - existing_emi
    
    # Ensure non-negative
    if max_new_emi < 0:
        max_new_emi = 0
    
    # Step 2: Calculate loan amount from EMI using loan formula
    # EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]
    # Rearranging: P = EMI × [(1+r)^n - 1] / [r × (1+r)^n]
    
    if max_new_emi > 0 and INTEREST_RATE_MONTHLY > 0:
        r = INTEREST_RATE_MONTHLY
        n = TENURE_MONTHS
        
        numerator = (1 + r) ** n - 1
        denominator = r * (1 + r) ** n
        
        eligible_loan_amount = max_new_emi * (numerator / denominator)
    else:
        eligible_loan_amount = 0
    
    # Step 3: Apply LTV cap (max 80% of property value)
    max_loan_by_ltv = property_value * LTV_RATIO
    eligible_loan_amount = min(eligible_loan_amount, max_loan_by_ltv)
    
    # Step 4: Calculate actual EMI for the eligible loan
    if eligible_loan_amount > 0 and INTEREST_RATE_MONTHLY > 0:
        P = eligible_loan_amount
        r = INTEREST_RATE_MONTHLY
        n = TENURE_MONTHS
        
        monthly_emi = (P * r * (1 + r) ** n) / ((1 + r) ** n - 1)
    else:
        monthly_emi = 0
    
    # Step 5: Calculate metrics
    total_obligation = existing_emi + monthly_emi
    debt_to_income_ratio = (total_obligation / monthly_income * 100) if monthly_income > 0 else 0
    
    # Step 6: Generate recommendation
    if debt_to_income_ratio <= 40:
        recommendation = "Excellent"
        message = "Low Risk"
    elif debt_to_income_ratio <= 50:
        recommendation = "Good"
        message = "Moderate Risk"
    elif debt_to_income_ratio <= 60:
        recommendation = "Moderate"
        message = "Higher Risk"
    else:
        recommendation = "High Risk"
        message = "Caution Advised"
    
    return {
        'eligible_loan_amount': round(eligible_loan_amount, 2),
        'monthly_emi': round(monthly_emi, 2),
        'total_monthly_obligation': round(total_obligation, 2),
        'debt_to_income_ratio': round(debt_to_income_ratio, 2),
        'recommendation': f"{recommendation} - {message}",
        'max_ltv_amount': round(max_loan_by_ltv, 2),
        'interest_rate': INTEREST_RATE_ANNUAL,
        'tenure_years': TENURE_MONTHS // 12
    }








# ============================================
# MAIN HANDLER FUNCTION
# ============================================
def handle_user_query(user_input: str) -> Dict[str, Any]:
    """Complete workflow: Intent + Bank + Response"""
    
    # Predict intent
    predicted_intent = predict_intent(user_input)
    
    # Detect bank
    bank = detect_bank(user_input)
    
    # Build response
    response = {
        'user_query': user_input,
        'detected_intent': predicted_intent,
        'detected_bank': bank,
        'response': None
    }
    
    # Check if we have handler for this intent
    if predicted_intent in INTENT_HANDLERS:
        intent_data = INTENT_HANDLERS[predicted_intent]
        
        # Check if this is a simple info-only intent (no bank needed)
        if 'type' in intent_data and intent_data['type'] in ['info', 'greeting', 'goodbye', 'thanks']:
            # Simple message response - no bank selection needed
            response['response'] = {
                'message': intent_data.get('message', 'I can help you with that.'),
                'type': intent_data['type']
            }
        # Bank-specific intent
        elif bank and bank in intent_data:
            response['response'] = intent_data[bank]
            response['response']['type'] = 'workflow'
        else:
            # Ask which bank
            response['response'] = {
                'message': f"I can help you with {predicted_intent.replace('_', ' ')}. Which bank/platform are you using?",
                'available_banks': list(intent_data.keys()),
                'type': 'bank_selection'
            }
    else:
        response['response'] = {
            'message': f"I detected your query is about '{predicted_intent.replace('_', ' ')}', but I don't have detailed guidance for this yet. Could you please rephrase or specify your bank?",
            'type': 'not_found'
        }
    
    return response


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================
class ChatRequest(BaseModel):
    session_id: str
    user_input: str

class ChatResponse(BaseModel):
    user_query: str
    detected_intent: str
    detected_bank: Optional[str] = None
    response: Any

# ============================================
# API ENDPOINTS
# ============================================
@app.get("/")
def read_root():
    return {
        "message": "Banking Assistant API is running!",
        "status": "active",
        "version": "1.0"
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """Main chat endpoint with session context support"""
    try:
        session_id = request.session_id
        user_input = request.user_input.strip()
        
        # Check if session has pending context
        if session_id in session_context:
            context = session_context[session_id]
            
            # ============================================
            # HANDLE LOAN CALCULATOR INPUT
            # ============================================
            if context.get('pending_action') == 'awaiting_loan_calculation':
                try:
                    # Parse comma-separated numbers
                    values = [int(val.strip()) for val in user_input.split(',')]
                    if len(values) != 3:
                        raise ValueError("Need exactly 3 values")
                    
                    income, existing_emi, property_value = values
                    
                    # Calculate eligibility
                    results = calculate_loan_eligibility(income, existing_emi, property_value)
                    
                    # Format response
                    response = {
                        'user_query': user_input,
                        'detected_intent': 'loan_calculation_result',
                        'detected_bank': context.get('bank'),
                        'response': {
                            'type': 'loan_calculation',
                            'message': f"📊 **Loan Eligibility Results**\n\n"
                                      f"💼 Monthly Income: ₹{income:,}\n"
                                      f"💳 Existing EMIs: ₹{existing_emi:,}\n"
                                      f"🏠 Property Value: ₹{property_value:,}\n\n"
                                      f"✅ **Maximum Loan Amount:** ₹{results['eligible_loan_amount']:,}\n"
                                      f"✅ **Monthly EMI @ 8.5%:** ₹{results['monthly_emi']:,}\n"
                                      f"✅ **Total Obligation:** ₹{results['total_monthly_obligation']:,}\n"
                                      f"📈 **Debt-to-Income Ratio:** {results['debt_to_income_ratio']}%\n\n"
                                      f"💡 **Recommendation:** {results['recommendation']}\n\n"
                                      + ("✅ You're eligible! Your debt-to-income ratio is healthy." if results['debt_to_income_ratio'] < 65 else "⚠️ Caution: High debt ratio. Consider reducing EMIs or increasing income."),
                            'calculation_data': results
                        }
                    }
                    
                    # Clear context
                    del session_context[session_id]
                    return response
                    
                except ValueError:
                    return {
                        'user_query': user_input,
                        'detected_intent': 'error',
                        'detected_bank': None,
                        'response': {
                            'type': 'error',
                            'message': "❌ Please enter exactly 3 numbers separated by commas:\n\n"
                                      "Format: income, existing_emi, property_value\n"
                                      "Example: 80000, 15000, 5000000"
                        }
                    }
            
            # ============================================
            # HANDLE "DOCS" AND "STEPS" BUTTONS
            # ============================================
            if user_input.lower() in ['docs', 'steps']:
                stored_intent = context.get('detected_intent')
                stored_bank = context.get('detected_bank')
                
                if stored_intent == 'loan_eligibility_check' and stored_bank:
                    if user_input.lower() == 'docs':
                        # Required documents response
                        return {
                            'user_query': user_input,
                            'detected_intent': 'loan_documents',
                            'detected_bank': stored_bank,
                            'response': {
                                'type': 'info',
                                'message': f"📄 **Required Documents for {stored_bank} Home Loan:**\n\n"
                                          f"**Identity Proof:**\n"
                                          f"• PAN Card (mandatory)\n"
                                          f"• Aadhaar Card\n"
                                          f"• Passport/Voter ID/Driving License\n\n"
                                          f"**Address Proof:**\n"
                                          f"• Aadhaar Card\n"
                                          f"• Utility bills (electricity/water)\n"
                                          f"• Passport\n\n"
                                          f"**Income Proof:**\n"
                                          f"• Last 6 months' salary slips\n"
                                          f"• Last 2 years' ITR with computation\n"
                                          f"• Form 16\n"
                                          f"• Bank statements (6 months)\n\n"
                                          f"**Property Documents:**\n"
                                          f"• Sale deed/Agreement to sell\n"
                                          f"• Approved building plan\n"
                                          f"• NOC from builder\n"
                                          f"• Encumbrance certificate\n\n"
                                          f"**Additional:**\n"
                                          f"• Passport size photographs\n"
                                          f"• Processing fee cheque"
                            }
                        }
                    
                    elif user_input.lower() == 'steps':
                        # Application steps response
                        return {
                            'user_query': user_input,
                            'detected_intent': 'loan_application_steps',
                            'detected_bank': stored_bank,
                            'response': {
                                'type': 'info',
                                'message': f"📋 **{stored_bank} Home Loan Application Steps:**\n\n"
                                          f"**Step 1: Check Eligibility** ✅\n"
                                          f"Use the loan calculator to verify your eligibility based on income, credit score, and EMI capacity.\n\n"
                                          f"**Step 2: Prepare Documents** 📄\n"
                                          f"Gather all required documents (identity, income, property papers).\n\n"
                                          f"**Step 3: Apply Online/Offline** 💻\n"
                                          f"• Online: Visit {stored_bank} website → Home Loans → Apply Now\n"
                                          f"• Offline: Visit nearest {stored_bank} branch\n\n"
                                          f"**Step 4: Property Evaluation** 🏠\n"
                                          f"Bank will conduct technical and legal evaluation of the property.\n\n"
                                          f"**Step 5: Loan Approval** ✅\n"
                                          f"Based on documents and property evaluation, loan will be sanctioned.\n\n"
                                          f"**Step 6: Disbursement** 💰\n"
                                          f"After signing the loan agreement, funds will be disbursed as per payment schedule.\n\n"
                                          f"**Timeline:** Typically 7-15 working days from application to disbursement."
                            }
                        }
            
            # ============================================
            # CHECK FOR "CALCULATE" TRIGGER (WITHIN SESSION)
            # ============================================
            if 'calculate' in user_input.lower():
                if context.get('detected_intent') == 'loan_eligibility_check':
                    # Prompt for calculator input
                    session_context[session_id]['pending_action'] = 'awaiting_loan_calculation'
                    session_context[session_id]['bank'] = context.get('detected_bank')
                    
                    return {
                        'user_query': user_input,
                        'detected_intent': 'loan_calculator_prompt',
                        'detected_bank': context.get('detected_bank'),
                        'response': {
                            'type': 'calculator_prompt',
                            'message': "Let's calculate your eligibility! 🧮\n\n"
                                      "Please provide the following separated by commas:\n\n"
                                      "1️⃣ Your monthly income (₹)\n"
                                      "2️⃣ Existing monthly EMIs (₹)\n"
                                      "3️⃣ Property value (₹)\n\n"
                                      "**Example:** 80000, 15000, 5000000"
                        }
                    }
            
            # ============================================
            # HANDLE BANK SELECTION
            # ============================================
            detected_bank = detect_bank(user_input)
            if detected_bank:
                stored_intent = context.get('detected_intent')
                
                response = {
                    'user_query': user_input,
                    'detected_intent': stored_intent,
                    'detected_bank': detected_bank,
                    'response': None
                }
                
                if stored_intent in INTENT_HANDLERS:
                    intent_data = INTENT_HANDLERS[stored_intent]
                    
                    if detected_bank in intent_data:
                        response['response'] = intent_data[detected_bank]
                        response['response']['type'] = 'workflow'
                        
                        # If loan eligibility with calculator, add options
                        if stored_intent == 'loan_eligibility_check' and intent_data[detected_bank].get('calculator_available'):
                            response['response']['options'] = [
                                {'label': '🧮 Calculate your loan eligibility', 'value': 'calculate'},
                                {'label': '📄 Show required documents', 'value': 'docs'},
                                {'label': '📋 Provide application steps', 'value': 'steps'}
                            ]
                        
                        # Update session with bank for potential calculator use
                        session_context[session_id]['detected_bank'] = detected_bank
                        
                        # DON'T delete context yet - keep it for "calculate" trigger
                        return response
                    else:
                        response['response'] = {
                            'message': f"Sorry, I don't have information for {detected_bank} regarding {stored_intent.replace('_', ' ')}.",
                            'type': 'not_found'
                        }
                        del session_context[session_id]
                        return response
        
        # ============================================
        # NORMAL QUERY PROCESSING
        # ============================================
        result = handle_user_query(user_input)
        
        # If response asks for bank, store context
        if result.get('response', {}).get('type') == 'bank_selection':
            session_context[session_id] = {
                'original_query': user_input,
                'detected_intent': result['detected_intent']
            }
        
        # If it's loan_eligibility_check with bank already detected, keep session
        if result.get('detected_intent') == 'loan_eligibility_check' and result.get('detected_bank'):
            session_context[session_id] = {
                'original_query': user_input,
                'detected_intent': result['detected_intent'],
                'detected_bank': result['detected_bank']
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
