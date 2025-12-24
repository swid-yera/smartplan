from fastapi import Header, HTTPException, status

from app.config import API_KEYS


def verify_api_key(x_api_key: str | None = Header(default=None)):
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
        )

    if x_api_key not in API_KEYS.values():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return x_api_key
