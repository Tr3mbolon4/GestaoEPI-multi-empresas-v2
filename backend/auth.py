from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db
from bson import ObjectId
import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'gestorepi-secret-key-production-2026-emerald')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Credenciais inválidas',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = await get_db()
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    if not user.get('is_active', True):
        raise HTTPException(status_code=400, detail='Usuário inativo')
    
    user['id'] = str(user['_id'])
    
    # MULTI-TENANT: Verificar empresa do usuário
    empresa_id = user.get('empresa_id')
    if empresa_id and user.get('role') != 'super_admin':
        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
        if empresa:
            # Verificar se empresa está bloqueada
            if empresa.get('status') == 'bloqueado':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='Empresa bloqueada. Entre em contato com o administrador.'
                )
            user['empresa_nome'] = empresa.get('nome')
        user['empresa_id'] = empresa_id
    
    return user

def require_role(*allowed_roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get('role')
        # SUPER_ADMIN sempre tem acesso
        if user_role == 'super_admin':
            return current_user
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Permissão insuficiente'
            )
        return current_user
    return role_checker

def require_super_admin():
    """Middleware exclusivo para SUPER_ADMIN (dono do sistema)"""
    async def super_admin_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get('role') != 'super_admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Acesso restrito ao Super Administrador'
            )
        return current_user
    return super_admin_checker

def get_empresa_filter(current_user: dict) -> dict:
    """
    Retorna filtro de empresa_id baseado no usuário.
    SUPER_ADMIN pode ver todos, outros só veem da sua empresa.
    """
    if current_user.get('role') == 'super_admin':
        return {}  # Sem filtro - vê todas as empresas
    
    empresa_id = current_user.get('empresa_id')
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Usuário não associado a uma empresa'
        )
    return {"empresa_id": empresa_id}
