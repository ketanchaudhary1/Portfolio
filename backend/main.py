import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field
from pypdf import PdfReader
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI


# -----------------------------
# Load Environment Variables
# -----------------------------

load_dotenv()


# -----------------------------
# Groq Configuration
# -----------------------------

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

model = "openai/gpt-oss-120b"


# -----------------------------
# FastAPI
# -----------------------------

app = FastAPI()


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://portfolio1-five-chi-58.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Resume Models
# -----------------------------

class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = Field(default_factory=list)


class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None

    total_experience_years: float | None = None

    skills: list[str] = Field(default_factory=list)
    experiences: list[Experience] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


resume_schema = Resume.model_json_schema()


# -----------------------------
# Chat Request
# -----------------------------

class ChatRequest(BaseModel):
    question: str


# -----------------------------
# Ask Candidate
# -----------------------------

def ask_candidate(question: str, resume: Resume):

    system_prompt = f"""
You are an AI assistant representing a job candidate.

Below is everything you know about the candidate.

{resume.model_dump_json(indent=2)}

Rules:

1. Answer only using this information.

2. Never hallucinate.

3. If information is unavailable, say:

"I don't have enough information to answer that."

4. Be professional.

5. Answer as if HR is interviewing this candidate.
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )

    return response.choices[0].message.content


# -----------------------------
# Parse Resume
# -----------------------------

def parse_resume(resume_text):

    system_prompt = f"""
You are an expert resume parser.

Extract information from the resume based on its meaning,
not only based on exact section headings.

Different resumes may use different headings.

For example:

- Experience
- Professional Experience
- Work History
- Employment
- Internships

These may all contain relevant experience.

Skills may also appear in the skills section, work experience,
internships or projects.

Return ONLY valid JSON matching this schema:

{resume_schema}

Important rules:

1. Do not invent information.

2. If a value is not available, return null.

3. If a list has no information, return an empty list.

4. Include internships inside experiences.

5. Extract skills mentioned across the entire resume.
"""

    user_prompt = f"""
Parse the following resume:

{resume_text}
"""

    message_system = {
        "role": "system",
        "content": system_prompt
    }

    message_user = {
        "role": "user",
        "content": user_prompt
    }

    messages = [
        message_system,
        message_user
    ]

    response_format = {
        "type": "json_object"
    }

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        response_format=response_format
    )

    raw_output = response.choices[0].message.content

    data = json.loads(raw_output)

    resume = Resume(**data)

    return resume


# -----------------------------
# PDF Extraction
# -----------------------------

def read_pdf(file_path: Path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# -----------------------------
# Home
# -----------------------------

@app.get("/")
def home():

    return {
        "message": "Ye home page hai"
    }


# -----------------------------
# Chat
# -----------------------------

@app.post("/chat")
def chat(request: ChatRequest):

    try:

        print("STEP 1: Chat started")

        pdf_path = (
            Path(__file__).parent
            / "Ketan_Chaudhary_sept.pdf"
        )

        print("STEP 2: PDF exists =", pdf_path.exists())

        resume_text = read_pdf(pdf_path)

        print("STEP 3: PDF read successfully")
        print("PDF text length =", len(resume_text))

        resume = parse_resume(resume_text)

        print("STEP 4: Resume parsed successfully")

        answer = ask_candidate(
            request.question,
            resume
        )

        print("STEP 5: Answer generated successfully")

        return {
            "answer": answer
        }

    except Exception as e:

        print("ERROR:", repr(e))

        raise