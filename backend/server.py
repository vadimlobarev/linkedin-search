from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Google API configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.environ.get('GOOGLE_CSE_ID')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class LinkedInProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    link: str
    snippet: str
    thumbnail: Optional[str] = None
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: List[str] = Field(default_factory=list)

class LinkedInProfileCreate(BaseModel):
    title: str
    link: str
    snippet: str
    thumbnail: Optional[str] = None
    tags: Optional[List[str]] = None

class SearchRequest(BaseModel):
    keywords: str
    location: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    start_index: int = 1

class ProfileFilterRequest(BaseModel):
    search_term: Optional[str] = None
    tags: Optional[List[str]] = None


@api_router.get("/")
async def root():
    return {"message": "LinkedIn Profile Search API"}

@api_router.post("/search")
async def search_linkedin_profiles(request: SearchRequest):
    """
    Search LinkedIn profiles using Google Custom Search API
    """
    try:
        # Build search query
        query_parts = [request.keywords]
        
        if request.location:
            query_parts.append(request.location)
        if request.job_title:
            query_parts.append(request.job_title)
        if request.company:
            query_parts.append(request.company)
        
        query = " ".join(query_parts) + " site:linkedin.com/in"
        
        # Make request to Google Custom Search API
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": GOOGLE_API_KEY,
            "cx": GOOGLE_CSE_ID,
            "q": query,
            "start": request.start_index,
            "num": 10
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Search API error")
        
        data = response.json()
        
        # Parse results
        results = []
        if "items" in data:
            for item in data["items"]:
                result = {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "thumbnail": item.get("pagemap", {}).get("cse_thumbnail", [{}])[0].get("src") if "pagemap" in item and "cse_thumbnail" in item["pagemap"] else None
                }
                results.append(result)
        
        return {
            "results": results,
            "total_results": data.get("searchInformation", {}).get("totalResults", "0"),
            "search_time": data.get("searchInformation", {}).get("searchTime", 0)
        }
    
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/profiles", response_model=LinkedInProfile)
async def save_profile(profile: LinkedInProfileCreate):
    """
    Save a LinkedIn profile to the database
    """
    try:
        # Check if profile already exists
        existing = await db.profiles.find_one({"link": profile.link}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Profile already saved")
        
        # Handle tags field properly
        profile_data = profile.model_dump()
        if profile_data.get('tags') is None:
            profile_data['tags'] = []
        
        profile_obj = LinkedInProfile(**profile_data)
        
        # Convert to dict and serialize datetime
        doc = profile_obj.model_dump()
        doc['saved_at'] = doc['saved_at'].isoformat()
        
        await db.profiles.insert_one(doc)
        return profile_obj
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/profiles", response_model=List[LinkedInProfile])
async def get_saved_profiles(search_term: Optional[str] = None, tags: Optional[str] = None):
    """
    Get saved profiles with optional filters
    """
    try:
        query = {}
        
        if search_term:
            query["$or"] = [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"snippet": {"$regex": search_term, "$options": "i"}}
            ]
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        profiles = await db.profiles.find(query, {"_id": 0}).sort("saved_at", -1).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for profile in profiles:
            if isinstance(profile['saved_at'], str):
                profile['saved_at'] = datetime.fromisoformat(profile['saved_at'])
        
        return profiles
    
    except Exception as e:
        logger.error(f"Get profiles error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """
    Delete a saved profile
    """
    try:
        result = await db.profiles.delete_one({"id": profile_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"message": "Profile deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/profiles/{profile_id}/tags")
async def update_profile_tags(profile_id: str, tags: List[str]):
    """
    Update tags for a saved profile
    """
    try:
        result = await db.profiles.update_one(
            {"id": profile_id},
            {"$set": {"tags": tags}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"message": "Tags updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update tags error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()