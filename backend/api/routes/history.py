from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

from api.routes.review import review_store

@router.get("/history")
async def get_history(limit: int = Query(default=20, le=100)):
    reviews = list(review_store.values())
    reviews.sort(key=lambda x: x["created_at"], reverse=True)
    return {"total": len(reviews), "reviews": reviews[:limit]}


@router.get("/history/{review_id}")
async def get_review(review_id: str):
    if review_id not in review_store:
        raise HTTPException(status_code=404, detail="Review not found")
    return review_store[review_id]


@router.delete("/history/{review_id}")
async def delete_review(review_id: str):
    if review_id not in review_store:
        raise HTTPException(status_code=404, detail="Review not found")
    del review_store[review_id]
    return {"deleted": True, "id": review_id}