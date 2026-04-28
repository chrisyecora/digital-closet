import os
import time
import httpx
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError
from sqlalchemy.orm import Session
from database import get_db
from db_models import User, Closet
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
ALGORITHMS = ["RS256"]

security = HTTPBearer()

# Simple in-memory cache for JWKS
jwks_cache = {
    "keys": None,
    "last_fetched": 0
}
JWKS_CACHE_TTL = 3600  # 1 hour

async def get_jwks():
    """Fetch JWKS from Clerk with caching."""
    now = time.time()
    if jwks_cache["keys"] is None or (now - jwks_cache["last_fetched"]) > JWKS_CACHE_TTL:
        async with httpx.AsyncClient() as client:
            response = await client.get(CLERK_JWKS_URL)
            response.raise_for_status()
            jwks_cache["keys"] = response.json()["keys"]
            jwks_cache["last_fetched"] = now
    return jwks_cache["keys"]

async def verify_token(token: str):
    """Verify and decode the Clerk JWT."""
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            logger.error("Auth Error: Missing kid in token header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing kid in token header",
            )

        jwks = await get_jwks()
        rsa_key = {}
        for key in jwks:
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            logger.error(f"Auth Error: Invalid kid. Found kid: {kid}, Available kids: {[k['kid'] for k in jwks]}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid kid",
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            options={"verify_aud": False}  # Clerk tokens might not have 'aud' set by default
        )
        return payload
    except JWTError as e:
        logger.error(f"Auth Error: JWTError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth Error: Exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during token verification: {str(e)}",
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency to get the current user from the token.
    Creates a user record and a closet if they don't exist.
    """
    token = credentials.credentials
    logger.debug(f"Token starts with: {token[:10]}...")
    payload = await verify_token(token)
    
    clerk_user_id = payload.get("sub")
    # Clerk tokens often do not include 'email' by default unless specifically configured in the Clerk dashboard.
    # We will use a placeholder or empty string if it's missing, as the primary identifier is 'sub'.
    email = payload.get("email") or ""
    logger.debug(f"Decoded payload sub: {clerk_user_id}, email: {email}")
    
    if not clerk_user_id:
        logger.error("Auth Error: Invalid token payload: missing sub")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub",
        )

    # Check if user exists
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    
    if not user:
        # Create user on first successful auth
        user = User(clerk_user_id=clerk_user_id, email=email)
        db.add(user)
        db.flush()  # Get user.id
        
        # Create a closet for the new user
        closet = Closet(user_id=user.id)
        db.add(closet)
        
        db.commit()
        db.refresh(user)
    
    return user
