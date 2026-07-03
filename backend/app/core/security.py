from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings

# Argon2 is the current algorithm for all new/updated hashes. BcryptHasher stays
# registered only so accounts hashed before this migration can still verify —
# see verify_and_rehash() and its use in the login route in api/auth.py.
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def verify_and_rehash(password: str, hashed: str) -> tuple[bool, Optional[str]]:
    """Verify a password, returning a fresh Argon2 hash to persist if the
    stored hash was produced by a non-current hasher (e.g. legacy bcrypt)."""
    return password_hash.verify_and_update(password, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    return int(payload["sub"])
