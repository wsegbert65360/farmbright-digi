# Hardened Supabase Connection Logic (Python)
# This code ensures that the backend respects multi-tenant RLS policies using the User's JWT.

import os
from datetime import datetime
from supabase import create_client, Client
import streamlit as st

def get_supabase_client() -> Client:
    """
    Initializes the Supabase client using the User's JWT (access_token).
    This triggers Row Level Security (RLS) policies based on auth.jwt().
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    # Note: Use the ANON_KEY for client-side/authenticated-user requests
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    # Retrieve the active session JWT from Streamlit session state
    # (Expected to be populated during the login flow)
    user_jwt = st.session_state.get("supabase_jwt")
    
    # Initialize the client
    client = create_client(supabase_url, supabase_key)
    
    if user_jwt:
        # Crucial: Set the JWT for the client to enforce RLS
        client.postgrest.auth(user_jwt)
    else:
        # Optional: Handle unauthenticated state or use a limited key
        pass
        
    return client

def soft_delete_record(table_name: str, record_id: str):
    """
    Implements a soft delete by setting the deleted_at timestamp.
    The Supabase RLS policy 'tenant_isolation' will automatically filter
    out these records from future SELECT queries.
    """
    db = get_supabase_client()
    
    # Perform soft delete
    result = db.table(table_name).update({
        "deleted_at": datetime.utcnow().isoformat()
    }).eq("id", record_id).execute()
    
    return result

# --- Example Usage in a Model / View ---

def list_livestock():
    db = get_supabase_client()
    
    # The 'tenant_isolation' RLS policy ensures:
    # 1. We ONLY see data for our specific 'farm_id'
    # 2. We ONLY see data where 'deleted_at' is NULL
    response = db.table("Livestock").select("*").execute()
    return response.data
