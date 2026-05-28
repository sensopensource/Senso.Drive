# apour simplifier limlementation des cariables dans le code 
import os
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OLLAMA_BASE_URL    = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL       = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct-q4_K_M")
LLM_RESUME_BACKEND = os.getenv("LLM_RESUME_BACKEND", "anthropic")
STOCKAGE_QUOTA_OCTETS = int(os.getenv("STOCKAGE_QUOTA_OCTETS", str(20*1024**3)))

