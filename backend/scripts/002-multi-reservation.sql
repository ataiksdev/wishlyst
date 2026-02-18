-- Migration to support multiple reservations per item

CREATE TABLE IF NOT EXISTS item_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data from wishlist_items
INSERT INTO item_reservations (item_id, name, reserved_at)
SELECT id, claimed_by, claimed_at
FROM wishlist_items
WHERE is_claimed = true AND claimed_by IS NOT NULL;

-- We keep the old columns for a bit to avoid breaking existing code immediately, 
-- but we'll stop using them in the API.
-- ALTER TABLE wishlist_items DROP COLUMN is_claimed;
-- ALTER TABLE wishlist_items DROP COLUMN claimed_by;
-- ALTER TABLE wishlist_items DROP COLUMN claimed_at;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_item_reservations_item_id ON item_reservations(item_id);
