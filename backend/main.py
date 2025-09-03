"""
Punto de entrada principal para Admin Daily Report API
"""
import uvicorn
from src.config import settings


if __name__ == "__main__":
    # Ejecutar servidor con configuracion desde settings
    uvicorn.run(
        "src.api:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
        access_log=True,
        loop="asyncio"
    )