from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from app.api.graphql.schema import schema

app = FastAPI(
    title="Lidercom Metrics API",
    description="API para recolección de datos de workshops y métricas",
    version="0.1.0"
)

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
async def root():
    return {"message": "Lidercom Metrics API", "graphql_endpoint": "/graphql"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
