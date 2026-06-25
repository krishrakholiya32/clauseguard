"""Static checklists of common Indian red-flag clause patterns, injected into the
LLM prompt per document type to keep domain knowledge data-driven and easy to extend."""

REDFLAG_CHECKLISTS: dict[str, list[str]] = {
    "rental": [
        "Security deposit exceeding state-typical norms (e.g. >2-3 months' rent) with no clear refund timeline",
        "Landlord allowed to enter the property without reasonable prior notice",
        "Tenant made solely responsible for repairs that are normally the landlord's duty (structural, plumbing)",
        "Lock-in period preventing the tenant from vacating early without a steep, one-sided penalty",
        "Notice period that is much shorter for the tenant than for the landlord",
        "Deposit forfeiture clauses for vague or minor reasons (e.g. 'any damage' undefined)",
        "No mention of how/when the deposit will be returned after move-out",
        "Automatic rent escalation clauses with unusually high percentages",
        "Clauses waiving the tenant's rights under local Rent Control regulations",
    ],
    "employment": [
        "Notice period or bond period that is much longer for the employee than for the employer",
        "Training bond / penalty clause requiring repayment of a large sum if the employee resigns early",
        "Non-compete clause that is overly broad in scope, geography, or duration (often unenforceable in India but still intimidating)",
        "Clauses allowing termination without cause and without severance or notice",
        "Vague performance-based termination criteria left entirely to employer discretion",
        "No clarity on variable pay / bonus being guaranteed vs. discretionary",
        "Intellectual property clauses claiming rights over the employee's personal projects unrelated to work",
        "Excessive working hours expectations with no overtime compensation mentioned",
        "Forced arbitration clauses that waive the employee's right to approach labour courts",
    ],
    "loan": [
        "Prepayment / foreclosure penalty that is unusually high",
        "Floating interest rate clauses with no cap or clear reset methodology",
        "Processing fees, legal fees, or 'other charges' left undefined or open-ended",
        "Default clauses triggering immediate full repayment for a single missed payment",
        "Personal guarantee or collateral clauses disproportionate to the loan amount",
        "Auto-renewal or auto-debit clauses without clear opt-out mechanism",
        "Hidden insurance or add-on product bundling tied to loan approval",
        "Unilateral right for the lender to change terms without borrower consent",
    ],
    "freelance": [
        "Scope of work left vague, allowing the client to demand unlimited revisions or extra deliverables",
        "Payment terms with no clear due dates, or full payment contingent on vague 'client satisfaction'",
        "Kill fee / cancellation clause that pays the freelancer nothing if the project is cancelled mid-way",
        "Intellectual property clauses transferring rights before final payment is made",
        "Non-compete clauses overly broad for a short-term freelance engagement",
        "No late-payment penalty or interest clause protecting the freelancer",
        "Client allowed to use unlimited revisions/scope creep without additional pay",
    ],
    "nda": [
        "Definition of 'confidential information' so broad it covers information that was already public",
        "No time limit on confidentiality obligations (perpetual NDA with no expiry)",
        "One-sided NDA where only one party's information is protected despite mutual disclosure",
        "Overly broad non-solicitation or non-compete clauses bundled into what should be a confidentiality-only agreement",
        "Unreasonable liability/penalty clauses for accidental, non-malicious disclosure",
        "No carve-outs for information that becomes public independently or was already known",
    ],
    "sale": [
        "No clear timeline for delivery, possession, or transfer of title",
        "Payment schedule heavily front-loaded before any goods/property/services are delivered",
        "Vague 'as-is' clauses disclaiming all defects without proper disclosure of known issues",
        "Penalty clauses for buyer delay that are far harsher than penalties for seller delay",
        "No clear refund/cancellation terms if the deal falls through",
        "Missing or vague clauses on who bears registration, transfer, or stamp duty costs",
    ],
    "insurance": [
        "Broad or vague exclusion clauses that could let the insurer deny common claims",
        "Waiting periods or sub-limits not clearly disclosed upfront",
        "Claim documentation requirements that are unusually burdensome or time-limited",
        "Premium escalation clauses with no cap as the policyholder ages or renews",
        "Free-look period or cancellation terms buried or unclear",
        "Co-payment or deductible clauses that significantly reduce the effective payout",
    ],
    "other": [
        "One-sided termination rights favoring only one party",
        "Unusually broad indemnity or liability clauses placed entirely on one party",
        "Auto-renewal clauses with no easy cancellation mechanism",
        "Vague or undefined key terms that could be interpreted unfavorably",
        "Hidden fees, penalties, or charges not clearly disclosed upfront",
        "Dispute resolution clauses that are inconvenient or biased (e.g. distant jurisdiction)",
    ],
}


def get_checklist(doc_type: str) -> list[str]:
    return REDFLAG_CHECKLISTS.get(doc_type, REDFLAG_CHECKLISTS["other"])
