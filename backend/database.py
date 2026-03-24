from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'cipolatti_db')

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await create_indexes()
    return db

async def close_db():
    global client
    if client:
        client.close()

async def get_db():
    global db
    if db is None:
        await connect_db()
    return db

async def create_indexes():
    global db
    
    # Users indexes
    await db.users.create_indexes([
        IndexModel([("username", ASCENDING)], unique=True),
        IndexModel([("email", ASCENDING)], unique=True)
    ])
    
    # Employees indexes - MULTI-TENANT: único por empresa
    await db.employees.create_indexes([
        IndexModel([("cpf", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"cpf": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="cpf_empresa_unique"),
        IndexModel([("full_name", ASCENDING)])
    ])
    
    # Companies indexes (empresas são globais)
    await db.companies.create_indexes([
        IndexModel([("cnpj", ASCENDING)], unique=True)
    ])
    
    # EPIs indexes - MULTI-TENANT: único por empresa
    await db.epis.create_indexes([
        IndexModel([("ca_number", ASCENDING)]),
        IndexModel([("internal_code", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"internal_code": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="internal_code_empresa_unique"),
        IndexModel([("qr_code", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"qr_code": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="qr_code_empresa_unique")
    ])
    
    # Tools indexes - MULTI-TENANT: único por empresa
    await db.tools.create_indexes([
        IndexModel([("serial_number", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"serial_number": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="serial_empresa_unique"),
        IndexModel([("internal_code", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"internal_code": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="tools_internal_code_empresa_unique"),
        IndexModel([("qr_code", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"qr_code": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="tools_qr_code_empresa_unique")
    ])
    
    # Suppliers indexes - MULTI-TENANT: único por empresa
    await db.suppliers.create_indexes([
        IndexModel([("cnpj", ASCENDING), ("empresa_id", ASCENDING)], unique=True, 
                   partialFilterExpression={"cnpj": {"$type": "string"}, "empresa_id": {"$type": "string"}},
                   name="cnpj_empresa_unique")
    ])
