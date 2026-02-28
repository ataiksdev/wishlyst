from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    answer: str
    new_password: str

class AdminPasswordReset(BaseModel):
    new_password: str

class UserLogin(BaseModel):
    email: str
    password: str

class WishlistCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = True

class WishlistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class WishlistItemCreate(BaseModel):
    name: str
    price: Optional[float] = None
    currency: str = "NGN"
    tag: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class WishlistItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    tag: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class ClaimItem(BaseModel):
    name: str

class UnclaimItem(BaseModel):
    name: str

class WishlistClone(BaseModel):
    title: str

class PromotedItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "NGN"
    url: Optional[str] = None
    image_url: Optional[str] = None

class PromotedItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class PromotedWishlistCreate(BaseModel):
    wishlist_id: str
    category: Optional[str] = "Seasonal"

class PromotedWishlistUpdate(BaseModel):
    category: Optional[str] = None
    display_order: Optional[int] = None

class ScrapeRequest(BaseModel):
    url: str
