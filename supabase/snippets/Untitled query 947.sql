-- Migration 0012: promote known admin operators
-- Safe no-op if either profile has not been created yet.

update profiles
set role = 'admin',
    updated_at = now()
where lower(email) in ('admin@machinvision.global', 'admin@machinvision.com');
