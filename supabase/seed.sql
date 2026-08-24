-- VietVerse starter data. Safe to run once after schema.sql.
insert into public.announcements (title, body, expires_at)
select 'Chào mừng đến VietVerse', 'VietVerse V2 đã sẵn sàng. Hãy tạo tài khoản và khám phá các game Việt!', now() + interval '30 days'
where not exists (select 1 from public.announcements);
