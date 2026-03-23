from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Integer)
    original_price = Column(Integer, nullable=True)
    discount_rate = Column(Integer, nullable=True)
    source = Column(String)
    url = Column(String)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
