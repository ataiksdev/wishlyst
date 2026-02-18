-- Create promoted_wishlists table
CREATE TABLE IF NOT EXISTS promoted_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'Seasonal', -- e.g., 'Valentine', 'Ramadan', 'Easter', 'Staff Pick'
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_promoted_wishlists_category ON promoted_wishlists(category);
