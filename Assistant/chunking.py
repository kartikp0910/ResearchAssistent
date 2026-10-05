import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings  # Use local embeddings
from langchain_chroma import Chroma

def build_vector_store(papers_dir: str = "./research_papers/", db_dir: str = "./chroma_db"):
    print("Loading text documents...")
    loader = DirectoryLoader(papers_dir, glob="**/*.txt", loader_cls=TextLoader)
    raw_docs = loader.load()
    
    if not raw_docs:
        raise ValueError(f"No documents found in {papers_dir}! Make sure your file is there.")

    # Use a lightweight, high-performance local embedding model
    print("Initializing local embeddings...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Executing semantic context-aware chunking...")
    text_splitter = SemanticChunker(
        embeddings=embeddings,
        breakpoint_threshold_type="percentile",
        breakpoint_threshold_amount=90
    )
    
    docs = text_splitter.split_documents(raw_docs)
    print(f"Created {len(docs)} semantic chunks.")

    vector_store = Chroma.from_documents(docs, embeddings, persist_directory=db_dir)
    return vector_store

def load_vector_store(db_dir: str = "./chroma_db"):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma(persist_directory=db_dir, embedding_function=embeddings)