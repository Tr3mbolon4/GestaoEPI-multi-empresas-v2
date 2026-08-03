from database import get_db
from auth import get_password_hash
from datetime import datetime, timedelta, timezone
import asyncio
import logging

logger = logging.getLogger(__name__)

async def seed_database():
    db = await get_db()
    
    # ===================== SUPER_ADMIN (DONO DO SISTEMA) =====================
    existing_super = await db.users.find_one({"role": "super_admin"})
    if not existing_super:
        super_admin = {
            "username": "superadmin",
            "email": "super@gestorepi.com",
            "hashed_password": get_password_hash("Super@2026!"),
            "role": "super_admin",
            "is_primary_admin": True,
            "must_change_password": True,
            "is_active": True,
            "empresa_id": None,  # SUPER_ADMIN não pertence a nenhuma empresa
            "password_changed_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(super_admin)
        logger.info("✅ SUPER_ADMIN criado: superadmin / Super@2026!")
    else:
        logger.info("SUPER_ADMIN já existe")
    
    # ===================== EMPRESA DE DEMONSTRAÇÃO =====================
    existing_empresa = await db.empresas.find_one({"cnpj": "00.000.000/0001-00"})
    if not existing_empresa:
        demo_empresa = {
            "nome": "Empresa Demonstração",
            "cnpj": "00.000.000/0001-00",
            "status": "ativo",
            "plano": "150",
            "limite_colaboradores": 150,
            "endereco": "Rua Demonstração, 123 - Centro",
            "telefone": "(11) 99999-9999",
            "email": "contato@demo.com.br",
            "responsavel": "Administrador Demo",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await db.empresas.insert_one(demo_empresa)
        empresa_id = str(result.inserted_id)
        logger.info(f"✅ Empresa de demonstração criada: {demo_empresa['nome']}")
        
        # Criar admin da empresa demo
        admin_demo = {
            "username": "admin",
            "email": "admin@demo.com",
            "hashed_password": get_password_hash("Admin@2026!"),
            "role": "admin",
            "empresa_id": empresa_id,
            "is_primary_admin": False,
            "must_change_password": True,
            "is_active": True,
            "password_changed_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_demo)
        logger.info(f"✅ Admin da empresa demo criado: admin / Admin@2026!")
        
        # Criar colaborador de teste vinculado à empresa
        existing_employee = await db.employees.find_one({"cpf": "000.000.000-00"})
        if not existing_employee:
            test_employee = {
                "full_name": "João da Silva (Demo)",
                "cpf": "000.000.000-00",
                "empresa_id": empresa_id,  # MULTI-TENANT
                "employee_code": "FUNC001",
                "admission_date": datetime.now(timezone.utc).date().isoformat(),
                "department": "Produção",
                "position": "Operador de Máquinas",
                "blood_type": "O+",
                "contact_phone": "(11) 98765-4321",
                "emergency_contact": "Maria da Silva - (11) 91234-5678",
                "status": "active",
                "facial_consent": True,
                "notes": "Funcionário de demonstração",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.employees.insert_one(test_employee)
            logger.info(f"✅ Colaborador de teste criado: {test_employee['full_name']}")
    else:
        empresa_id = str(existing_empresa['_id'])
        logger.info("Empresa de demonstração já existe")
        
        # Verificar se admin existe, se não criar
        existing_admin = await db.users.find_one({"username": "admin", "empresa_id": empresa_id})
        if not existing_admin:
            # Atualizar admin existente ou criar novo
            old_admin = await db.users.find_one({"username": "administrador"})
            if old_admin:
                await db.users.update_one(
                    {"_id": old_admin['_id']},
                    {"$set": {"empresa_id": empresa_id}}
                )
                logger.info("Admin existente atualizado com empresa_id")
    
    # Criar licença
    existing_license = await db.panel_license.find_one({})
    if not existing_license:
        license_doc = {
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.panel_license.insert_one(license_doc)
        logger.info("Licença do painel criada: 30 dias")
    
    logger.info("=" * 50)
    logger.info("CREDENCIAIS DE ACESSO:")
    logger.info("=" * 50)
    logger.info("SUPER ADMIN (Painel Master):")
    logger.info("  Usuário: superadmin")
    logger.info("  Senha: Super@2026!")
    logger.info("")
    logger.info("ADMIN EMPRESA DEMO:")
    logger.info("  Usuário: admin")
    logger.info("  Senha: Admin@2026!")
    logger.info("=" * 50)
    logger.info("Seed concluído com sucesso")

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())
