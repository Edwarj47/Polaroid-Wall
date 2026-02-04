-- Collection-level title/subtitle for wall

alter table collections add column if not exists wall_title text;
alter table collections add column if not exists wall_subtitle text;
