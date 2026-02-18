-- Create table for admin-promoted items
CREATE TABLE promoted_items (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'NGN',
    url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster retrieval by creation date
CREATE INDEX idx_promoted_items_created_at ON promoted_items(created_at DESC);
