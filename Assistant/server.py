import os
import traceback
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chunking import load_vector_store, build_vector_store
from retrieval import get_compression_retriever
from graph_workflow import create_rag_graph

# Load environment variables
load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY is missing from environment variables or .env file.")

# Global variable to hold the compiled LangGraph app across requests
rag_app = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes the RAG research assistant pipeline cleanly on startup."""
    global rag_app
    print("Initializing RAG Research Assistant pipeline...")
    
    # If vector db doesn't exist yet, build it automatically, else load it
    if not os.path.exists("./chroma_db"):
        print("Vector database not found. Building from './research_papers/'...")
        vector_store = build_vector_store()
    else:
        vector_store = load_vector_store()

    # Initialize high-k retriever and local cross-encoder reranker
    retriever = get_compression_retriever(vector_store, top_k_retrieval=20, top_n_rerank=6)
    
    # Compile graph app
    rag_app = create_rag_graph(retriever)
    print("RAG pipeline initialized successfully!")
    yield
    print("Shutting down RAG application...")

# Initialize FastAPI app with lifespan manager
app = FastAPI(
    title="Grounded RAG Research Assistant API",
    description="FastAPI service backed by LangGraph, Gemini, semantic chunking, and local reranking.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React/Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Pydantic Models
class QueryRequest(BaseModel):
    question: str = Field(..., description="The research query or question to ask the documents.", example="What optimization bottlenecks are associated with scaling sequence lengths in transformer models?")

class QueryResponse(BaseModel):
    question: str
    answer: str

@app.post("/query", response_model=QueryResponse)
async def query_research_assistant(request: QueryRequest):
    """Endpoint to submit a research question to the grounded RAG system."""
    if not rag_app:
        raise HTTPException(status_code=500, detail="RAG application is not initialized.")
    
    try:
        result = rag_app.invoke({"question": request.question})
        return QueryResponse(
            question=request.question,
            answer=result.get("generation", "No generation returned.")
        )
    except Exception as e:
        # Prints the complete traceback in your terminal to easily catch any internal issues
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API status."""
    return {"status": "healthy", "pipeline_loaded": rag_app is not None}