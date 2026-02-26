# Python Backend Refactor Template
# This logic ensures the Supabase client uses the user's JWT to trigger RLS policies.

import os
from supabase import create_client, Client
import streamlit as st

def get_supabase_client(user_jwt: str = None) -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    
    # Initialize client
    client = create_client(url, key)
    
    if user_jwt:
        # Pass the JWT so RLS policies (auth.jwt() ->> 'farm_id') work correctly
        # In the Python SDK, we can set the auth header for the postgrest client
        client.postgrest.auth(user_jwt)
    
    return client

# Usage in Streamlit
def dashboard():
    # Retrieve JWT from session state (populated during Auth flow)
    token = st.session_state.get("supabase_token")
    
    if not token:
        st.error("Authentication required")
        return
        
    db = get_supabase_client(token)
    
    # Queries will now be restricted by RLS (only rows with user's farm_id and deleted_at is NULL)
    result = db.table("livestock").select("*").execute()
    st.write(result.data)

# Soft Delete Implementation Example
def soft_delete_record(table: str, record_id: str):
    token = st.session_state.get("supabase_token")
    db = get_supabase_client(token)
    
    from datetime import datetime
    db.table(table).update({"deleted_at": datetime.utcnow().isoformat()}).eq("id", record_id).execute()
