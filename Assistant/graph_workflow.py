from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

class GraphState(TypedDict):
    question: str
    documents: List[str]
    generation: str
    route: str  # "research" or "casual"

def intent_router_node(state: GraphState):
    """Classifies user intent to route between casual chat and research retrieval."""
    question = state["question"]
    
    router_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an intent classifier. Determine if the user's input is a casual greeting, small talk, or conversational chat ('casual'), or if it requires searching through technical research documents ('research'). Respond with ONLY the word 'casual' or 'research'."),
        ("human", "{question}")
    ])
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0)
    chain = router_prompt | llm
    
    response = chain.invoke({"question": question})
    intent = response.content.strip().lower()
    
    route = "casual" if "casual" in intent else "research"
    return {"route": route}

def casual_node(state: GraphState):
    """Handles friendly casual conversation without document retrieval."""
    question = state["question"]
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful, friendly AI research assistant. Respond naturally and politely to the user's casual remark or greeting."),
        ("human", "{question}")
    ])
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
    chain = prompt | llm
    response = chain.invoke({"question": question})
    return {"generation": response.content}

def create_retrieve_node(retriever):
    def retrieve_node(state: GraphState):
        question = state["question"]
        docs = retriever.invoke(question)
        return {"documents": [doc.page_content for doc in docs]}
    return retrieve_node

def safety_guardrail_node(state: GraphState):
    """Verifies retrieved documents contain valid semantic context."""
    docs = state.get("documents", [])
    if not docs:
        return {"generation": "Safety Guardrail Triggered: I could not retrieve verified information matching your criteria within the reference documents."}
    return state

def generate_node(state: GraphState):
    """Generates a detailed, grounded response using Gemini."""
    if "Safety Guardrail Triggered" in state.get("generation", ""):
        return state
        
    docs = state.get("documents", [])
    context_text = "\n\n".join(docs)
    
    # Updated prompt emphasizing depth, structure, and thorough explanations
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert academic research assistant. Provide a detailed, comprehensive, and well-structured response to the user's question, drawing thoroughly from the provided reference document context. Break down key concepts, explain technical mechanisms step-by-step, and provide complete context rather than giving a brief summary. If the answer cannot be found in the context, state clearly that you cannot answer based on the provided documents.\n\nContext:\n{context}"),
        ("human", "{question}")
    ])
    
    # Slightly raised temperature to 0.2 for better narrative flow and elaboration
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
    chain = prompt | llm
    response = chain.invoke({"context": context_text, "question": state["question"]})
    
    return {"generation": response.content}

def create_rag_graph(retriever):
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("router", intent_router_node)
    workflow.add_node("casual_chat", casual_node)
    workflow.add_node("retrieve", create_retrieve_node(retriever))
    workflow.add_node("guardrail", safety_guardrail_node)
    workflow.add_node("generate", generate_node)
    
    # Define edges & routing
    workflow.set_entry_point("router")
    
    workflow.add_conditional_edges(
        "router",
        lambda state: state["route"],
        {
            "casual": "casual_chat",
            "research": "retrieve"
        }
    )
    
    workflow.add_edge("casual_chat", END)
    workflow.add_edge("retrieve", "guardrail")
    workflow.add_edge("guardrail", "generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()