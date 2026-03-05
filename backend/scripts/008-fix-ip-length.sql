-- Increase IP column length to handle proxy chains or long IPv6 strings
ALTER TABLE wishlist_views ALTER COLUMN viewer_ip TYPE TEXT;
