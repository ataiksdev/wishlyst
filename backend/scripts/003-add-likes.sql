-- Add like_count to wishlists table
ALTER TABLE wishlists ADD COLUMN like_count INTEGER DEFAULT 0;

-- Create wishlist_likes table to track unique likes (IP-based)
CREATE TABLE IF NOT EXISTS wishlist_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    viewer_ip TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_id, viewer_ip)
);

-- Index for fast lookup
CREATE INDEX idx_wishlist_likes_wishlist_id ON wishlist_likes(wishlist_id);
CREATE INDEX idx_wishlist_likes_viewer_ip ON wishlist_likes(viewer_ip);
