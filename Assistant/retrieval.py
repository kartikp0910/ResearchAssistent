from langchain_classic.retrievers import ContextualCompressionRetriever
from langchain_classic.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

def get_compression_retriever(vector_store, top_k_retrieval: int = 5, top_n_rerank: int = 3):
    """
    Retrieves a high volume of candidate chunks (k=50 to 100) 
    and compresses/reranks them locally using an open-source Hugging Face Cross-Encoder.
    """
    base_retriever = vector_store.as_retriever(search_kwargs={"k": top_k_retrieval})
    
    # Initialize local open-source cross-encoder model
    model = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-large")
    
    # Wrap it with CrossEncoderReranker compressor
    compressor = CrossEncoderReranker(model=model, top_n=top_n_rerank)
    
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor, 
        base_retriever=base_retriever
    )
    
    return compression_retriever