import os
from dotenv import load_dotenv

# Load environment variables from the .env file FIRST
load_dotenv()

# Verify keys are loaded (Optional debug check)
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY is missing from environment variables or .env file.")

from chunking import build_vector_store, load_vector_store
from retrieval import get_compression_retriever
from graph_workflow import create_rag_graph

if __name__ == "__main__":
    # Step 1: Run ingestion if you haven't created the vector database yet
    # vector_store = build_vector_store()

    # Or load existing vector database
    vector_store = load_vector_store()

    # Step 2: Initialize high-k retriever with reranker
    retriever = get_compression_retriever(vector_store, top_k_retrieval=80, top_n_rerank=5)

    # Step 3: Compile LangGraph application
    app = create_rag_graph(retriever)

    # Step 4: Run a query safely through the pipeline
    query = "What are the core optimization bottlenecks identified in the scaling transformer papers?"
    print(f"\nQuerying: '{query}'\n")
    
    result = app.invoke({"question": query})
    print("--- Final Grounded Response ---")
    print(result["generation"])